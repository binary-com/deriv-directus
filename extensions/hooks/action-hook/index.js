const axios = require('axios');

module.exports = function registerHook({ env, exceptions }) {
    const { ServiceUnavailableException } = exceptions;
    const { PERSONAL_ACCESS_TOKEN } = env;

    const triggerAction = async () => {
        console.log('trigger_action');
        const headers = {
            'Content-Type': 'application/vnd.github.v3+json',
            Authorization: `bearer ${PERSONAL_ACCESS_TOKEN}`,
        };
        const body = { event_type: 'cms-hook' };
        try {
            await axios.post(
                'https://api.github.com/repos/mustofa-binary/deriv-com/dispatches',
                body,
                { headers }
            );
            console.log('axios done');
        } catch (error) {
            console.log(error);
            throw new ServiceUnavailableException(error);
        }
    };

    const setWebHook = async (input) => {
        if (input.event === 'items.delete') {
            triggerAction();
        } else {
            try {
                let is_triggering_status = false;
                console.log('input item');
                console.log(input.item);
                await Promise.all(
                    input.item.map(async (single_item) => {
                        const article = await input.database
                            .select('*')
                            .from(input.collection)
                            .where({ article_id: single_item });

                        console.log('article');
                        console.log(article);
                        is_triggering_status =
                            article[0].status === 'published' ||
                            article[0].status === 'archived';
                    })
                );

                console.log('is_triggering_status');
                console.log(is_triggering_status);
                if (is_triggering_status) {
                    triggerAction();
                }
            } catch (err) {
                console.log(err);
            }
        }
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
