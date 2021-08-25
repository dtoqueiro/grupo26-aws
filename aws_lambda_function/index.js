const { handleCors, handleRequest, res } = require("./utils")

exports.handler = async (event) => {
	const { routeKey, pathParameters, body } = event

	if (routeKey.startsWith("OPTIONS")) {
		return handleCors(event.headers)
	}

	try {
		return await handleRequest(routeKey, body, pathParameters)
	} catch (error) {
		return res(400, { message: error })
	}
}
