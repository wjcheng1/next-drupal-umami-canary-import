import { sortDate } from '@pantheon-systems/nextjs-kit';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import { isMultiLanguage } from '../../lib/isMultiLanguage.js';
import {
	getCurrentLocaleStore,
	globalDrupalStateStores,
} from '../../lib/stores.js';

import Link from 'next/link';
import Layout from '../../components/layout';
import PageHeader from '../../components/page-header';
import styles from './index.module.css';

export default function PageListTemplate({
	hrefLang,
	sortedPages,
	footerMenu,
	multiLanguage,
}) {
	const { locale } = useRouter();
	return (
        <Layout footerMenu={footerMenu}>
			<NextSeo
				title="Decoupled Next Drupal Demo"
				description="Generated by create-pantheon-decoupled-kit."
				languageAlternates={hrefLang || false}
			/>{' '}
			<PageHeader title="Pages" />
			<div className={`${styles.content} flex flex-col max-w-screen-md`}>
				{sortedPages ? (
					<ul>
						{sortedPages?.map(({ id, title, body, path }) => (
							<li key={id}>
								<h2>{title}</h2>
								{body.summary ? (
									<div dangerouslySetInnerHTML={{ __html: body?.summary }} />
								) : null}
								<Link
									passHref
									href={`${
										multiLanguage ? `/${path?.langcode || locale}` : ''
									}${path.alias}`}
									className='underline'
								>
									Read more →
								</Link>
							</li>
						))}
					</ul>
				) : (
					<h2 className={`${styles.notFound} font-semibold text-center`}>No pages found 🏜</h2>
				)}
			</div>
		</Layout>
    );
}

export async function getServerSideProps(context) {
	const origin = process.env.NEXT_PUBLIC_FRONTEND_URL;
	const { locales, locale } = context;
	// if there is more than one language in context.locales,
	// assume multilanguage is enabled.
	const multiLanguage = isMultiLanguage(locales);
	const hrefLang = locales.map((locale) => {
		return {
			hrefLang: locale,
			href: origin + '/' + locale,
		};
	});

	const store = getCurrentLocaleStore(locale, globalDrupalStateStores);

	try {
		const pages = await store.getObject({
			objectName: 'node--page',
			refresh: true,
			res: context.res,
			params: 'fields[node--page]=id,title,body,path',
			anon: true,
		});

		const footerMenu = await store.getObject({
			objectName: 'menu_items--main',
			refresh: true,
			res: context.res,
			anon: true,
		});

		if (!pages) {
			return { props: { footerMenu } };
		}

		const sortedPages = sortDate({
			data: pages,
			key: 'changed',
			direction: 'asc',
		});

		return {
			props: {
				sortedPages,
				footerMenu,
				hrefLang,
				multiLanguage,
			},
		};
	} catch (error) {
		console.error('Unable to fetch data for pages: ', error);
		return {
			notFound: true,
		};
	}
}
