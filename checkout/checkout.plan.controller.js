const db = require(__dirname + "/../../models"),
    User            = db.user,
    Payment         = db.payment,
    CardUser        = db.cardUser,
    Plan            = db.plan,
    Feature         = db.feature,
    { OAuth2Client } = require('google-auth-library'),
    CronJob         = require('cron').CronJob,
    crypto          = require('crypto'),
    moment          = require('moment'),
    stripe          = require('stripe')(process.env.SECRET_STRIPE_KEY),
    nodemailer      = require("nodemailer");

exports.checkoutPlan = async (req, res) => {
    try {

        const plan = await Plan.findOne({ name: req.body.name });
        if (plan) {

            await checkCustomerIsExistOrNot(req, res, plan);

            const subscribe = await User.findByIdAndUpdate(req.user._id, { $set: { plan: plan._id, stillOpen: true } }, { new: true })
                .populate({
                    path: "plan",
                    populate: {
                        path: 'features',
                        model: 'Feature'
                    }
                });
                
            await sendMail(req, res, plan)
            res.status(200).send({ status: 200, subscribe, success: true });
        } else {
            throw { status: 404, message: "plan not found", success: false };
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        });
    }
}

const checkCustomerIsExistOrNot = async (req, res, plan) => {

    const customers = await stripe.customers.list();
    const customerExist = customers.data.map(customer => customer.email === req.user.email ? true : false);

    if (customerExist.includes(true)) {
        await customerIsExist(req, res, plan, customers);
    } else {
        await customerIsNotExist(req, res, plan);
    }
}

const customerIsExist = async (req, res, plan, customers) => {
    return customers.data.map(async customer => {
        if (customer.email === req.user.email) {
            let features;

            for (let i = 0; i < plan.features.length; i++) {
                features = await Feature.findOne({ _id: plan.features[i] });
            }
            const product = await stripe.products.create({
                name: plan.name,
                images: [],
                description: features.name
            });

            const price = await stripe.prices.create({
                unit_amount: plan.price * 100,
                currency: req.body.currency,
                product: product.id
            });


            // modify old paln to a new plan in payment
            const planExist = await Payment.findOne({ buyer: req.user._id, plan: req.user.plan, type: 'plan' });
            let amount = plan.price * 100; // charge amount default value
            // modify old paln to a new plan in payment
            if (planExist) {
                const extractPlan = await Plan.findOne({ _id: planExist.plan });

                // calc diff from end_in process = 3 in env
                const diff = moment(planExist.end_in).subtract(process.env.SUBTRACT_END, 'months');
                const sameMoment = moment().isSame(diff); // today is same diff
                const beforeMoment = moment().isBefore(diff); // today is before diff

                if (extractPlan.name === process.env.PLAN_LOW && plan.name === process.env.PLAN_HIGH && (sameMoment || beforeMoment)) {
                    planExist.price = plan.price - extractPlan.price;
                    amount = (plan.price - extractPlan.price) * 100; // calc amount if plan === standard and want change it to premium
                }
                else {
                    planExist.price = plan.price;
                }
                planExist.stillOpen = true;
                planExist.plan = plan._id;
                planExist.end_in = moment(planExist.end_in).add(req.num, req.str).format();
            }
            const charge = await stripe.charges.create({
                customer: customer.id,
                amount,
                currency: req.body.currency,
                description: plan.name,
            });

            if (charge.paid && charge.status === 'succeeded') {
                if (planExist && planExist.end_in) {
                    // to test put new Date(req.body.end_in) instead planExist.end_in and don't send time but must send end_in in postman body formdata and become format 2021-03-27T12:51:38.000+00:00
                    const job = await new CronJob(planExist.end_in, async () => {
                        //runs once at the specified date.
                        req.user.stillOpen = false;
                        planExist.stillOpen = false;
                        await planExist.save();
                        await req.user.save();
                    })
                    job.start();
                    await planExist.save();
                    await sendMail(req, res, plan)
                } else {
                    // create plan in payment this code run if a user start buy course
                    const payment = await new Payment({
                        plan: plan._id,
                        buyer: req.user._id,
                        price: plan.price,
                        currency: plan.currency,
                        paid: charge.paid,
                        status: charge.status,
                        end_in: req.end_in,
                        type: 'plan'
                    });
                    if (payment.end_in) {
                        // to test put new Date(req.body.end_in) instead payment.end_in and don't send time but must send end_in in postman body formdata and become format 2021-03-27T12:51:38.000+00:00
                        const job = await new CronJob(payment.end_in, async () => {
                            //runs once at the specified date.
                            payment.stillOpen = false;
                            await payment.save();
                        })
                        job.start();
                    }
                    await payment.save();
                }
            }
        }

        // change end_in all course buy without plan to end_in new buy plan
        // after buy new plan expensive from old plan or renew subscrption all courses stillOpe true 
        const courses = await Payment.find({ buyer: req.user._id, $or: [{ price: 0 }, { price: { $gt: 0 } }], type: 'course' });
        if (courses) {
            courses.map(async course => {
                course.stillOpen = true;
                if (course.end_in) {
                    course.price = 0;
                    course.end_in = undefined;
                }
                await course.save();
            });
        }
    })
}

const customerIsNotExist = async (req, res, plan) => {
    let card = {
        number: req.body.number,
        exp_month: req.body.exp_month,
        exp_year: req.body.exp_year,
        cvc: req.body.cvc,
    };

    const stripeToken = await stripe.tokens.create({
        card
    });

    const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        source: stripeToken.id
    });

    let features;

    for (let i = 0; i < plan.features.length; i++) {
        features = await Feature.findOne({ _id: plan.features[i] })
    };
    const product = await stripe.products.create({
        name: plan.name,
        images: [],
        description: features.name
    });

    const price = await stripe.prices.create({
        unit_amount: plan.price * 100,
        currency: req.body.currency,
        product: product.id
    });

    const charge = await stripe.charges.create({
        customer: customer.id,
        amount: plan.price * 100,
        currency: req.body.currency,
        description: plan.name,
    });
    if (charge.paid && charge.status === 'succeeded') {

        const payment = await new Payment({
            plan: plan._id,
            buyer: req.user._id,
            price: plan.price,
            currency: plan.currency,
            paid: charge.paid,
            status: charge.status,
            end_in: req.end_in,
            type: 'plan'
        });

        if (payment.end_in) {
            // to test put new Date(req.body.end_in) instead payment.end_in and don't send time but must send end_in in postman body formdata and become format 2021-03-27T12:51:38.000+00:00
            const job = await new CronJob(payment.end_in, async () => {
                //runs once at the specified date.
                payment.stillOpen = false;
                await payment.save();
            })
            job.start();
        }
        await payment.save();

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
        });
        await card.save();
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
};

const sendMail = async (req, res, plan) => {
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
        subject: `BetaAI - Buy a ${plan.name} plan`,
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
                                  <p style="font-size: 14px; direction: ltr"><strong>Plan: </strong> <a href="">Introduction to python</a></p>
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
                message: error.message || "email message checkout plan not sent",
                success: false
            };
        }
        else{
            console.log(`Email Sent ${body.response}`);
        }
    });
}
