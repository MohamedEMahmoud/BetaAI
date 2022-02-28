const db = require(__dirname + "/../../models"),
    User = db.user,
    Course = db.course,
    Cart = db.cart,
    Payment = db.payment,
    Account = db.account,
    CardInstructor = db.cardInstructor,
    CardUser = db.cardUser,
    Coupon = db.coupon,
    Domain = db.domain,
    BestSeller = db.bestseller,
    Sale = db.sale,
    Chat = db.chat,
    moment = require("moment"),
    { OAuth2Client } = require('google-auth-library'),
    crypto = require('crypto'),
    stripe = require('stripe')(process.env.SECRET_STRIPE_KEY),
    nodemailer = require("nodemailer");


exports.checkoutMechanism = async (req, res) => {
    try {
        const plan = await Payment.findOne({ buyer: req.user._id, plan: req.user.plan, stillOpen: true, type: 'plan' })
        const coupons = await Coupon.find({ coupon: req.query.coupon });
        let couponsStatus = coupons.map(coupon => coupon.status);

        if (couponsStatus.includes(true)) {
            let totalDiscount = 0;

            coupons.map(async coupon => {
                if (coupon.times > 0) {
                    totalDiscount += coupon.discount;
                    coupon.users = [...coupon.users, req.user._id];
                    coupon.times -= 1;
                    if (coupon.times === 0) {
                        coupon.status = false
                    }
                    await coupon.save();
                }
            });

            const cart = await Cart.findOne({ buyer: req.user._id });

            if (cart) {
                const course = await Course.find({ _id: { $in: cart.courses } });
                await couponExecute(req, res, course, cart, totalDiscount);
            } else {
                throw { status: 404, message: "Cart not found", success: false };
            }

        } else {
            const cart = await Cart.findOne({ buyer: req.user._id });

            if (cart) {
                const course = await Course.find({ _id: { $in: cart.courses } });
                plan ? await havePlan(req, res, course, cart, plan) : await haveDomain(req, res, course, cart);
            } else {
                throw { status: 404, message: "Cart not found", success: false };
            }

        }
    } catch (e) {
        console.log(e)
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

const couponExecute = async (req, res, course, coupon, cart) => {
    course.map(async paymentCourse => {
        paymentCourse.price = await paymentCourse.price - ((paymentCourse.price * coupon) / 100);

        // add course to bestseller
        const course = await BestSeller.findOne({ product: paymentCourse.slug });

        if (course) {
            course.times += 1;
            await course.save();
        }
        else {
            const newItem = await new BestSeller({ product: paymentCourse.slug });
            await newItem.save();
        }
    });

    await checkCustomerIsExistOrNot(req, res, course, cart);
}

const haveDomain = async (req, res, course, cart) => {
    const cutEmail = req.user.email.split("@")[1];
    const domain = await Domain.findOne({ domain: cutEmail, active: true });

    if (domain) {
        course.map(async paymentCourse => {
            paymentCourse.price = await paymentCourse.price - ((paymentCourse.price * domain.discount) / 100);

            // add course to bestseller
            const course = await BestSeller.findOne({ product: paymentCourse.slug });

            if (course) {
                course.times += 1;
                await course.save();
            }
            else {
                const newItem = await new BestSeller({ product: paymentCourse.slug });
                await newItem.save();
            }
        })
    }
    return await checkCustomerIsExistOrNot(req, res, course, cart);
}

const havePlan = async (req, res, course, cart, plan) => {
    if (plan) {
        course.map(async paymentCourse => {
            paymentCourse.price = 0

            // add course to bestseller
            const course = await BestSeller.findOne({ product: paymentCourse.slug });

            if (course) {
                course.times += 1;
                await course.save();
            }
            else {
                const newItem = await new BestSeller({ product: paymentCourse.slug });
                await newItem.save();
            }
        })
    }
    return await checkCustomerIsExistOrNot(req, res, course, cart, plan);
}

const checkCustomerIsExistOrNot = async (req, res, course, cart, plan) => {

    const customers = await stripe.customers.list();
    const customerExist = customers.data.map(customer => customer.email === req.user.email ? true : false);

    if (customerExist.includes(true)) {
        await customerIsExist(req, res, course, customers, cart, plan);
    } else {
        await customerIsNotExist(req, res, course, cart, plan);
    }
}


const customerIsExist = async (req, res, course, customers, cart, plan) => {
    return customers.data.map(async customer => {
        if (customer.email === req.user.email) {
            course.map(async (paymentCourse) => {
                const product = await stripe.products.create({
                    name: paymentCourse.title,
                    images: [],
                    description: paymentCourse.brief
                });

                const price = await stripe.prices.create({
                    unit_amount: paymentCourse.price * 100,
                    currency: req.body.currency,
                    product: product.id
                });
            })

            const charge = plan ? { paid: true, status: 'succeeded', description: `${await description(cart)}` } : await stripe.charges.create({
                customer: customer.id,
                source: customer.default_source,
                amount: cart.total * 100,
                currency: req.body.currency,
                description: `${await description(cart)}`,
            });

            if (charge.paid && charge.status === 'succeeded') {
                await Promise.all(
                    course.map(async paymentCourse => {
                        // Renew Subscription Course
                        const RenewSubscriptionCourse = await Payment.findOne({ buyer: req.user._id, course: paymentCourse._id })

                        // renew course paid with plan as single subscription
                        if (RenewSubscriptionCourse && RenewSubscriptionCourse.price === 0 && !RenewSubscriptionCourse.stillOpen) {
                            RenewSubscriptionCourse.price = paymentCourse.price;
                            RenewSubscriptionCourse.stillOpen = true;
                            RenewSubscriptionCourse.end_in = req.end_in;
                            await RenewSubscriptionCourse.save();
                        }

                        // Renew single course subscription
                        else if (RenewSubscriptionCourse && RenewSubscriptionCourse.price > 0) {
                            RenewSubscriptionCourse.stillOpen = true;
                            // add additional period to course (ex: if course should end at(DD/MM/YYYY) 5/5/2021 and user renew it before this date, then it will end at 5/6/2021
                            RenewSubscriptionCourse.end_in = moment(RenewSubscriptionCourse.end_in).add(process.env.COURSE_PERIOD, "month").format();
                            await RenewSubscriptionCourse.save();
                        }
                        else {
                            // buy new course
                            const payment = await new Payment({
                                course: paymentCourse._id,
                                buyer: req.user._id,
                                price: paymentCourse.price,
                                currency: paymentCourse.currency,
                                paid: charge.paid,
                                status: charge.status,
                                end_in: plan ? undefined : req.end_in,
                                type: 'course'
                            })
                            await payment.save();
                        }

                        // await numberOfSales(paymentCourse);
                    })
                ).then(async () => {
                    await sendMail(req, res, course);
                    res.send({ status: 200, payment: "paid Successful", success: true })
                }).catch((e) => {
                    console.log(e)
                    res.status(e.status || 500).send({
                        status: e.status || 500,
                        message: e.message || "Server is not ready now",
                        success: false
                    })
                })
            }

        }
    })
}

const customerIsNotExist = async (req, res, course, cart, plan) => {
    let card = {
        number: req.body.number,
        exp_month: req.body.exp_month,
        exp_year: req.body.exp_year,
        cvc: req.body.cvc,
    }

    const stripeToken = await stripe.tokens.create({
        card
    });

    const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        source: stripeToken.id
    });
    course.map(async (paymentCourse) => {
        const product = await stripe.products.create({
            name: paymentCourse.title,
            images: [],
            description: paymentCourse.brief
        });
        const price = await stripe.prices.create({
            unit_amount: paymentCourse.price * 100,
            currency: req.body.currency,
            product: product.id
        });
    });

    const charge = plan ? { paid: true, status: 'succeeded', description: `${await description(cart)}` } : await stripe.charges.create({
        customer: customer.id,
        source: customer.default_source,
        amount: cart.total * 100,
        currency: req.body.currency,
        description: `${await description(cart)}`,
    });

    if (charge.paid && charge.status === 'succeeded') {

        const card = await new CardUser({
            buyer: req.user._id,
            number: encrypt(req.body.number),
            exp_month: charge.payment_method_details.card.exp_month,
            exp_year: charge.payment_method_details.card.exp_year,
            cvc: encrypt(req.body.cvc),
            last4: charge.payment_method_details.card.last4,
            brand: charge.source.brand,
            country: charge.payment_method_details.card.country,
            fingerprint: charge.payment_method_details.card.fingerprint,
            funding: charge.payment_method_details.card.funding,
            type: charge.payment_method_details.type,
            stripeCardId: charge.payment_method,
            stripeCustomerId: charge.customer,
            clientIp: stripeToken.client_ip,
            token: [stripeToken]
        })
        await card.save();

        await Promise.all(
            course.map(async paymentCourse => {

                const payment = await new Payment({
                    course: paymentCourse._id,
                    buyer: req.user._id,
                    price: paymentCourse.price,
                    currency: paymentCourse.currency,
                    paid: charge.paid,
                    status: charge.status,
                    end_in: plan ? undefined : req.end_in,
                    type: 'course'
                })
                await payment.save();

                // await numberOfSales(paymentCourse);
            })
        ).then(async () => {
            await sendMail(req, res, course);
            res.send({ status: 200, payment: "paid Successful", success: true })
        }).catch((e) => {
            console.log(e)
            res.status(e.status || 500).send({
                status: e.status || 500,
                message: e.message || "Server is not ready now",
                success: false
            })
        })
    }
}

const description = async (cart) => {
    const coursesNames = await Course.find({ _id: cart.courses });
    const names = coursesNames.map(paymentCourse => paymentCourse.title);
    // await cart.remove();
    return names.toString();
}

const numberOfSales = async (paymentCourse) => {
    const sales = await Sale.findOne({ instructor: paymentCourse.owner, course: paymentCourse._id });
    if (sales) {
        sales.times += 1;

        if (sale.times === process.env.NUMBER_OF_SALE_COURSE) {
            const instructor = await User.findOne({ _id: paymentCourse.owner });
            const accounts = await stripe.accounts.list({ limit: 100 });
            const accountExist = accounts.data.map(account => account.email === instructor.email ? true : false);
            if (accountExist.includes(true)) {
                return accounts.data.map(async account => {
                    if (account.email === instructors.email) {
                        await transferMoneyToInstructors(req, res, paymentCourse, charge, account)
                    }
                })
            }
            await sales.remove();
        }

        sales.updatedAt = Date.now();
        await sales.save();
    } else {
        const sale = await new Sale({
            course: paymentCourse._id,
            instructor: paymentCourse.owner,
        });
        await sale.save();
    }
}

const transferMoneyToInstructors = async (paymentCourse, charge, account) => {
    const transfer = await stripe.transfers.create({
        amount: (paymentCourse.price * 100) / 2,
        currency: "usd",
        destination: account.id,
        // source_transaction: charge.id
    });
    if (transfer) {
        await saveTransfer(transfer, paymentCourse)
    }
}

const saveTransfer = async (transfer, paymentCourse) => {
    const instructorBankAccount = await Account.findOne({ instructor: paymentCourse.owner })
    const instructorCard = await CardInstructor.findOne({ instructor: paymentCourse.owner })
    if (instructorBankAccount && transfer.destination === instructorBankAccount.stripeAccountId) {
        instructorBankAccount.transfer = [...instructorBankAccount.transfer, transfer]
        await instructorBankAccount.save()
    }
    if (instructorCard && transfer.destination === instructorCard.stripeAccountId) {
        instructorCard.transfer = [...instructorCard.transfer, transfer]
        await instructorCard.save()
    }
}

const encrypt = (text) => {
    const CRYPTO_KEY = process.env.CRYPTO_KEY;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-ctr', CRYPTO_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text.toString()), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
}

const sendMail = async (req, res, course) => {
    const client = await new OAuth2Client(process.env.CLIENT_ID, process.env.CLEINT_SECRET, process.env.REDIRECT_URI);
    client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
    const accessToken = await client.getAccessToken();

    let transport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: process.env.MAIL_SERVER_PORT,
        secure: true,
        auth: {
            type: 'OAuth2',
            user: process.env.MAIL_USER,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLEINT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken: accessToken,
        }
    });

    const message = {
        from: '"BetaAI Support" <no-reply@beta.ai>',
        to: req.user.email,
        subject: `BetaAI - Buy a ${course[0].title} Course`,
        html: `
                    <div style="text-align: center;  font-family: sans-serif; direction: ltr; width: 600px; margin: auto">
                        <img src="https://i.ibb.co/fCrSpsF/logo.jpg" alt="Beta AI" style="width: 250px">
                    
                        <div style="background: #F8F8F8; text-align: left">
                          
                          <div style="padding: 20px 10px; background: #041438; color: #FFFFFF; direction: ltr">
                            <h1 style="padding: 0; margin: 0; direction: ltr">Order Confirmation</h1>
                          </div>
                          
                          <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 10px; direction: ltr">
                            <div style="width: 50%; direction: ltr">
                              <h3 style="margin: 0; padding: 0">Purchased by:</h1>
                              <p style="font-size: 14px; direction: ltr"><strong>Name: </strong> ${req.user.name}</p>
                              <p style="font-size: 14px; direction: ltr"><strong>Email: </strong> <a href="mailto:${req.user.email}">${req.user.email}</a></p>
                              <p style="font-size: 14px; direction: ltr"><strong>Purchase Date: </strong>${new Date().toString().replace("GMT+0200 (Eastern European Standard Time)", "")}</p>
                            </div>
                            
                            <div style="width: 30%; direction: ltr">
                              <h3 style="margin: 0; padding: 0; direction: ltr">Soled by:</h1>
                              <p style="font-size: 14px; direction: ltr"><a href="${process.env.ClIENT_URL}">BetaAI</a></p>
                              <p style="font-size: 14px; direction: ltr">5th settlement, 11185, New Cairo</p>
                              <p style="font-size: 14px; direction: ltr">Egypt</p>
                            </div>
                          </div>
                          
                    
                          <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 10px; direction: ltr">
                            <div style="width: 50%; direction: ltr">
                              <h3 style="margin: 0; padding: 0">Receipt Details:</h1>
                              <p style="font-size: 14px; direction: ltr"><strong>Course: </strong> <a href="">Introduction to python</a></p>
                              <p style="font-size: 14px; direction: ltr"><strong>List Price: </strong>100$</p>
                              <p style="font-size: 14px; direction: ltr"><strong>Discount: </strong>0$</p>
                              <p style="font-size: 14px; direction: ltr"><strong>Tax: </strong>0$</p>
                              <p style="font-size: 14px; direction: ltr"><strong>Total: </strong>100$</p>
                            </div>
                            
                            <div style="width: 30%; direction: ltr">
                              <h3 style="margin: 0; padding: 0; direction: ltr">Need help ?</h1>
                              <p style="font-size: 14px; direction: ltr">Find it in our <a href="">Help Center</a>, or contact our <a href="mailto:">support team</a>.</p>
                            </div>
                          </div>
                          
                          
                        </div>
                    
                        <div style="color: #FFFFFF; background: #041438;">
                          <div style="display: flex; justify-content: space-around; align-items: center; margin: auto; width: 500px; flex-wrap: wrap; direction: ltr">
                            <a style="color: #FFFFFF; direction: ltr" href="">Support</a>
                            <p style="margin: 0 10px">|</p>
                            <a style="color: #FFFFFF; direction: ltr" href="">Find a Job</a>
                            <p style="margin: 0 10px">|</p>
                            <a style="color: #FFFFFF; direction: ltr" href="">Become an instructor</a>
                            <p style="margin: 0 10px">|</p>
                            <a style="color: #FFFFFF; direction: ltr" href="">Careers at BetaAI</a>
                          </div>
                          <p style="margin: 20px 0; direction: ltr">&copy; 2020 - <a style="color: #FFFFFF; direction: ltr" href="mailto:techno@beta.ai">BetaAI Technical Team</a>, All rights reserved</p>
                        </div>
                `
    };

    transport.verify((error) => {
        if (error) {
            console.log(error)
        }
        else {
            console.log('server is redy to send email')
        }
    });

    return await transport.sendMail(message, (error, body) => {
        if (error) {
            throw {
                status: 500,
                message: error.message || "email message about checkout course not sent",
                success: false
            };
        }
        else {
            console.log(`Email Sent ${body.response}`);
        }
    });
}

exports.deletePayment = async (req, res) => {
    try {
        await Payment.deleteMany()
        res.send({ status: 200, success: true })
    } catch (error) {
        res.status(error.status || 500).send({
            status: error.status || 500,
            message: error.message || "Server is not ready now",
            success: false
        })
    }
}

