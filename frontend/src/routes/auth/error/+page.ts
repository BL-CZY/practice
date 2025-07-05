export const load = ({ url }) => {
	url.searchParams.get('message');
	return {
		message: url.searchParams.get('message')
	};
};
