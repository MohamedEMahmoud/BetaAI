const db = require(__dirname + "/../../models"),
    User = db.user,
    Account = db.account,
    Role = db.role,
    CardInstructor = db.cardInstructor,
    crypto = require('crypto'),
    stripe = require('stripe')(process.env.SECRET_STRIPE_KEY);

exports.createInstructorAccount = async (req, res) => {
    try {
        const instructor = await User.findOne({ _id: req.user._id }).populate("roles", "_id name");

        // validate that user is not already instructor
        // for (let role in instructor.roles) {
        //     if (instructor.roles[role].name === "instructor") {
        //         return res.status(400).send({ status: 400, message: "You are already instructor", success: false });
        //     }
        // }

        const BankAccountOrDebitCard = () => {
            if (req.body.account_number) {
                return {
                    bank_account: {
                        country: req.body.country, //The country in which the bank account is located
                        currency: req.body.currency, //The currency the bank account is in
                        account_holder_name: instructor.name,
                        account_holder_type: 'individual',
                        routing_number: req.body.routing_number,
                        account_number: req.body.account_number,
                    }
                }
            }

            if (req.body.number) {
                return {
                    card: {
                        number: req.body.number,
                        exp_month: req.body.exp_month,
                        exp_year: req.body.exp_year,
                        currency: req.body.currency
                    }
                }
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

        const token = await stripe.tokens.create(
            BankAccountOrDebitCard()
        );

        //bank account data
        const account = await stripe.accounts.create({
            business_type: 'individual',
            business_profile: {
                support_email: instructor.email,
                support_url: req.body.support_url,
                // todo: add user profile link in 'url'
                url: "https://beta-ai.netlify.app/"
            },
            country: req.body.country,
            default_currency: req.body.currency,
            email: instructor.email,
            external_account: req.body.account_number ? token.id : undefined,
            type: "express"
        });

        let card;

        if (!req.body.account_number && req.body.number) {
            card = await stripe.accounts.createExternalAccount(
                account.id,
                { external_account: req.body.number ? token.id : undefined }
            );
        }

        let accountId = account.id;

        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: 'http://localhost:3000', // The URL that the user will be redirected to if the account link is no longer valid
            return_url: `http://localhost:3000/active/account?accountId=${accountId}`, // The URL that the user will be redirected to upon leaving or finish activation
            type: 'account_onboarding',
        });

        if (account) {
            if (req.body.account_number && req.body.routing_number) {
                await account.external_accounts.data.map(async bankAccount => {
                    const bank_account = await new Account({
                        instructor: instructor._id,
                        account_number: encrypt(req.body.account_number),
                        routing_number: bankAccount.routing_number,
                        bank_name: bankAccount.bank_name,
                        last4: bankAccount.last4,
                        country: bankAccount.country,
                        currency: bankAccount.currency,
                        capabilities: account.capabilities.transfers,
                        fingerprint: bankAccount.fingerprint,
                        type: account.type,
                        stripeBankAccountId: bankAccount.id,
                        stripeAccountId: bankAccount.account,
                        clientIp: token.client_ip,
                        account_link_url: accountLink.url,
                        token: [token]
                    })
                    await bank_account.save()
                })
            }

            else {
                const cardInstructorData = await new CardInstructor({
                    instructor: instructor._id,
                    number: encrypt(req.body.number),
                    exp_month: card.exp_month,
                    exp_year: card.exp_year,
                    last4: card.last4,
                    brand: card.brand,
                    country: card.country,
                    currency: card.currency,
                    capabilities: account.capabilities.transfers,
                    fingerprint: card.fingerprint,
                    funding: card.funding,
                    type: account.type,
                    stripeCardId: card.id,
                    stripeAccountId: card.account,
                    clientIp: token.client_ip,
                    account_link_url: accountLink.url,
                    token: [token]
                })
                await cardInstructorData.save()
            }
        }

        const role = await Role.findOne({ name: "instructor" });
        const user = await User.findOneAndUpdate({ _id: req.user._id }, { $addToSet: { roles: [role._id] } }, { new: true });

        res.send({ status: 200, accountLink: accountLink.url, user, success: true });

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.getInstructorCard = async (req, res) => {
    try {
        const card = await CardInstructor.findOne({ instructor: req.user._id })
            .populate({ path: "instructor" })

        const decrypt = (hash) => {
            const CRYPTO_KEY = process.env.CRYPTO_KEY;
            const decipher = crypto.createDecipheriv('aes-256-ctr', CRYPTO_KEY, Buffer.from(hash.iv, 'hex'));
            const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
            return decrpyted.toString();
        };

        if (card) {
            let data = {
                ...card._doc,
                number: decrypt(card.number),
            }

            res.send({ status: 200, card: data, success: true })
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.getInstructorAccount = async (req, res) => {
    try {
        const bank_account = await Account.findOne({ instructor: req.user._id })
            .populate({ path: "instructor" })

        const decrypt = (hash) => {
            const CRYPTO_KEY = process.env.CRYPTO_KEY;
            const decipher = crypto.createDecipheriv('aes-256-ctr', CRYPTO_KEY, Buffer.from(hash.iv, 'hex'));
            const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
            return decrpyted.toString();
        };

        if (bank_account) {
            let data = {
                ...bank_account._doc,
                account_number: decrypt(bank_account.account_number),
            }

            res.send({ status: 200, bank_account: data, success: true })
        }

    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}

exports.activeInstructorAccount = async (req, res) => {
    try {
        const bank_account = await Account.findOne({ stripeAccountId: req.query.accountId })

        const card = await CardInstructor.findOne({ stripeAccountId: req.query.accountId })

        if (bank_account) {
            bank_account.capabilities = 'active'
            await bank_account.save()
            res.send({ status: 200, message: 'Account activated successfully', success: true })
        }
        if (card) {
            card.capabilities = 'active'
            await card.save()
            res.send({ status: 200, message: 'Account activated successfully', success: true })
        }
    } catch (e) {
        res.status(e.status || 500).send({
            status: e.status || 500,
            message: e.message || "Server is not ready now",
            success: false
        })
    }
}