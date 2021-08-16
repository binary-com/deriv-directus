const axios = require('axios');

module.exports = function registerHook({ env, exceptions }) {
    const { ServiceUnavailableException } = exceptions;
    const { PERSONAL_ACCESS_TOKEN } = env;

    const triggerAction = () => {
		console.log('trigger_action')
        const headers = {
            'Content-Type': 'application/vnd.github.v3+json',
            Authorization: `token ${PERSONAL_ACCESS_TOKEN}`,
        };
        const body = { event_type: 'cms-hook' };
        try {
            await axios.post(
                'https://api.github.com/repos/mustofa-binary/deriv-com/dispatches',
                body,
                { headers }
            );
        } catch (error) {
            console.log(error);
            throw new ServiceUnavailableException(error);
        }
    };

    const setWebHook = async (input) => {
		console.log('set webhook')
		console.log(input)
        if (input.event === 'items.delete') {
            triggerAction();
        } else {
            try {
                let is_triggering_status = false;
                input.item.forEach((single_item) => {
                    const article = await input.database
                        .select('*')
                        .from(input.collection)
                        .where({ article_id: single_item });

                    is_triggering_status =
                        article[0].status === 'published' ||
                        article[0].status === 'archived';
                });

                if (is_triggering_status) {
                    triggerAction();
                }
            } catch (err) {
                console.log(err);
            }
        }
        console.log('result_input:');
        console.log(input);
        console.log('result_item:');
        console.log(input.item);
    };

    return {
        'items.create': function (input) {
            if (input.collection === 'articles') {
                setWebHook(input);
            }
        },
        'items.update': function (input) {
            if (input.collection === 'articles') {
                setWebHook(input);
            }
        },
        'items.delete': function (input) {
            if (input.collection === 'articles') {
                setWebHook(input);
            }
        },
    };
};
