const axios = require('axios')

module.exports = function registerHook({ env, exceptions }) {
    const { ServiceUnavailableException } = exceptions
    const { PERSONAL_ACCESS_TOKEN } = env

    const triggerAction = () => {
        const headers = {
            'Content-Type': 'application/vnd.github.v3+json',
            Authorization: `token ${PERSONAL_ACCESS_TOKEN}`,
        }
        const body = { event_type: 'cms-hook' }
        try {
            await axios.post('https://api.github.com/repos/binary-com/deriv-com/dispatches', body, {
                headers,
            })
        } catch (error) {
            throw new ServiceUnavailableException(error)
        }
    }

    const setWebHook = async (input) => {
        if (input.event === 'items.delete') {
            triggerAction()
        } else {
            try {
                let is_triggering_status = false
                input.item.forEach((single_item) => {
                    const blog_post = await input.database
                        .select('*')
                        .from(input.collection)
                        .where({ id: single_item })

                    is_triggering_status =
                        blog_post[0].status === 'published' || blog_post[0].status === 'archived'
                })

                if (is_triggering_status) {
                    triggerAction()
                }
            } catch (error) {
                throw new ServiceUnavailableException(error)
            }
        }
    }

    return {
        'items.create': function (input) {
            if (input.collection.match(/blog|videos/)) {
                setWebHook(input)
            }
        },
        'items.update': function (input) {
            if (input.collection.match(/blog|videos/)) {
                setWebHook(input)
            }
        },
        'items.delete': function (input) {
            if (input.collection.match(/blog|videos/)) {
                setWebHook(input)
            }
        },
    }
}
