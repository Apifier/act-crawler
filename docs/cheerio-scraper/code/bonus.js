async function pageFunction(context) {
    switch (context.request.userData.label) {
        case 'START': return handleStart(context);
        case 'DETAIL': return handleDetail(context);
    }

    async function handleStart({ log, waitFor, $ }) {
        log.info('Store opened!');

        const dataJson = $('#__NEXT_DATA__').html();
        // We requested HTML, but the data are actually JSON.
        const data = JSON.parse(dataJson);

        for (const item of data.props.pageProps.items) {
            const { name, username } = item;
            const actorDetailUrl = `https://apify.com/${username}/${name}`;
            await context.enqueueRequest({
                url: actorDetailUrl,
                userData: {
                    label: 'DETAIL',
                },
            });
        }
    }

    async function handleDetail({ request, log, skipLinks, $ }) {
        const { url } = request;
        log.info(`Scraping ${url}`);
        await skipLinks();

        // Do some scraping.
        const uniqueIdentifier = url
            .split('/')
            .slice(-2)
            .join('/');

        return {
            url,
            uniqueIdentifier,
            title: $('header h1').text(),
            description: $('header span.actor-description').text(),
            modifiedDate: new Date(
                Number(
                    $('ul.ActorHeader-stats time').attr('datetime'),
                ),
            ),
            runCount: Number(
                $('ul.ActorHeader-stats > li:nth-of-type(3)')
                    .text()
                    .match(/[\d,]+/)[0]
                    .replace(/,/g, ''),
            ),
        };
    }
}
