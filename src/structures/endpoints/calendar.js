module.exports = (app, client) => {
    app.post('/hook', async (req, res) => {
        //console.log(req) // Call your action on the request here
        await reloadCalendar();
        res.status(200).end(); // Responding is important
    });

    app.get('/verify', (req, res) => {
        console.log('Loaded verify page');
        res.status(200).send(
            '<p href="' + authorizeUrl + '">Log into Google to authenticate</p>' +
            '<p href="/verifysuccess">Check login status</p>'
        );
        //return res.render('verify', { authURL: authorizeUrl });
        //opn(authorizeUrl, {wait: false}).then(cp => cp.unref());
        //res.status(200).end();
    });

    app.get('/verifysuccess', (req, res) => {
        /**
         * here we should try to fetch the calendar and return if we are able to access it
         * 
         * The possible responses are:
         *  1. Success (200): logged in and can access calendar
         *  2. Forbidden (403): logged in but can't access
         *  3. Unauthorized (401): not logged in
         *  4. Service Unavailable (503): something weird happened
         */ 

        console.log('Loaded verifysuccess');
        if (Object.keys(tokens).length === 0) {
            res.status(503).send('Not logged in');
        } else {
            if (allowViewToken) {
                res.status(200).send(
                    'Success! Here is your authorization information:\n' + JSON.stringify(tokens)
                );
                allowViewToken = false;
            } else {
                res.status(200).send(
                    'We are authenticated. To view your token, please re-authenticate'
                );
            }
        }
        //return res.render("verifysuccess", { token: JSON.stringify(tokens) });
        //opn(authorizeUrl, {wait: false}).then(cp => cp.unref());
        //res.status(200).end();
    });

    app.get('/getCalendar', async (req, res) => {
        updates = await reloadCalendar();
        res.status(200).send(updates);
        //res.status(200).end();
    });

    app.get('/oauth2callback', async (req, res) => {
        const qs = new url.URL(req.url, 'https://acm-bot.tk:1337').searchParams;
        if (req.query.error) {
            // Check the authorizeUrl if we get this
            console.log('Bad authorize URL');
            return res.redirect('/verify');
        } else {
            try {
                response = await oauth2Client.getToken(qs.get('code'));

                if (response.res.status != 200) {
                    console.log('Our authentication request was not accepted');
                    console.log(response);
                }

                tokens = response.tokens;
                oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
                console.log(tokens);
            } catch (e) {
                console.log('Something went wronng with authentication');
                console.log(e);
                return res.redirect('/verifysuccess');
            }
        }
        allowViewToken = true;
        res.redirect('/verifysuccess');
    });
};
