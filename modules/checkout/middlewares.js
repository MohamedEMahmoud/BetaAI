const db = require(__dirname + "/../../models"),
    Plan = db.plan,
    Payment = db.payment,
    Domain = db.domain,
    User = db.user,
    Sale = db.sale;
    moment = require("moment");

calcEndIn_Plan = async (req, res, next) => {
    try {
        const plan = await Plan.findOne({ name: req.body.name });

        let num, str;
        if (plan.time) {
            num = parseInt(plan.time.match(/\d+/)[0]);
            str = plan.time.replace(num, '');
            str === 'd' ? str = 'days' : str === 'm' ? str = 'months' : str = 'years'
        }

        const end_in = moment().add(num, str).format();

        req.end_in = end_in;
        req.str = str;
        req.num = num;

        next();

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

endIn_Plan = async (req, res, next) => {
    try {
        const plan = await Payment.findOne({ buyer: req.user._id, plan: req.user.plan, stillOpen: true, type: 'plan' });

        const coursesPaidByPlan = await Payment.find({ buyer: req.user._id, stillOpen: true, price: 0, type: 'course' });

        if (plan && plan.end_in && (plan.end_in === new Date() || new Date() > plan.end_in)) {

            plan.stillOpen = false;

            req.user.stillOpen = false;

            coursesPaidByPlan.map(async course => {
                course.stillOpen = false;
                await course.save();
            });
            await req.user.save()
            await plan.save();
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

endIn_Domain = async (req, res, next) => {
    try {
        const cutEmail = req.user.email.split("@")[1];
        const domain = await Domain.findOne({ domain: cutEmail, active: true });
        if (domain && domain.end_in && (domain.end_in === new Date() || new Date() > domain.end_in)) {
            domain.active = false
            await domain.save()
        }
        next();
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

instructor = async (req, res, next) => {
    try {
        const sales = await Sale.find();

        await Promise.all(
            sales.map(async sale => {
                if ((sale.times === process.env.MAX_NUMBER_OF_TIMES_SALE || sale.times > process.env.MAX_NUMBER_OF_TIMES_SALE ) && (new Date() === moment(sale.updatedAt).add(process.env.TIME_OF_TRANSFER_MONEY_TO_INSTRUCTORS, process.env.DURATION_TIME_OF_TRANSFER_MONEY_TO_INSTRUCTORS) || new Date() > moment(sale.updatedAt).add(process.env.TIME_OF_TRANSFER_MONEY_TO_INSTRUCTORS, process.env.DURATION_TIME_OF_TRANSFER_MONEY_TO_INSTRUCTORS))) {
                    paymentCourse = sale.course;
                    const instructor = await User.findOne({ _id: paymentCourse.owner });
                    const accounts = await stripe.accounts.list({ limit: 100 });
                    const accountExist = accounts.data.map(account => account.email === instructor.email ? true : false)
                    if (accountExist.includes(true)) {
                        return accounts.data.map(async account => {
                            if (account.email === instructors.email) {
                                // todo: how much money transfer it to instructors and don't forget pass sale as pramater to calc money when sale.times === 10 or sale.times > 10
                                await transferMoneyToInstructors(req, res, paymentCourse, charge, account)
                            }
                        })
                    }
                    await sale.remove();
                }
            })
        )
        next()
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

const verifyPlan = {
    calcEndIn_Plan,
    endIn_Plan
}

const verifyDomain = {
    endIn_Domain
}

const sales = {
    instructor
}

module.exports = {
    verifyPlan,
    verifyDomain,
    sales
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

