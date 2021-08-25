const AWS = require("aws-sdk")

const dynamo = new AWS.DynamoDB.DocumentClient()

exports.handler = async (event) => {
	const { routeKey, pathParameters, body } = event

	const origin = event.headers.origin || event.headers.Origin

	if (routeKey.startsWith("OPTIONS")) {
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Allow-Origin": origin,
			},
			body: JSON.stringify({ message: "Success" }),
		}
	}

	try {
		return await handleRequest(routeKey, body, pathParameters)
	} catch (error) {
		return res(400, { message: error })
	}
}

const handleRequest = async (routeKey, body, pathParameters) => {
	if (routeKey === "GET /leads/{id}") {
		const { id } = pathParameters
		const lead = await dynamo
			.get({
				TableName: "leads",
				Key: {
					id,
				},
			})
			.promise()
		if (!Object.keys(lead).length)
			return res(404, { message: "Lead não encontrada." })
		return res(200, lead)
	}

	if (routeKey === "PUT /leads/{id}") {
		const { id } = pathParameters
		if (!id) return res(400, { message: "Parâmetros inválidos." })
		const lead = await dynamo
			.get({
				TableName: "leads",
				Key: {
					id,
				},
			})
			.promise()
		if (!Object.keys(lead).length)
			return res(404, { message: "Lead não encontrada." })
		if (lead.Item.clientSince)
			return res(409, { message: "Essa lead já foi atualizada." })
		await dynamo
			.update({
				TableName: "leads",
				Key: {
					id,
				},
				AttributeUpdates: {
					clientSince: {
						Value: Date.now(),
					},
				},
			})
			.promise()
		return res(200, { message: "Lead atualizada!" })
	}

	if (routeKey === "DELETE /leads/{id}") {
		const { id } = pathParameters
		if (!id) return res(400, { message: "Parâmetros inválidos." })
		await dynamo
			.delete({
				TableName: "leads",
				Key: {
					id,
				},
			})
			.promise()
		return res(200, { message: "Lead deletada!" })
	}

	if (routeKey === "GET /leads") {
		const leads = await dynamo.scan({ TableName: "leads" }).promise()
		if (!leads) return res(500, { message: "Erro no servidor." })
		return res(200, leads)
	}

	if (routeKey === "POST /leads") {
		const { id, nome, email, telefone } = JSON.parse(body)
		if (!id || !nome || !email || !telefone)
			return res(400, { message: "Parâmetros inválidos." })
		const lead = await dynamo
			.get({
				TableName: "leads",
				Key: {
					id,
				},
			})
			.promise()
		if (Object.keys(lead).length)
			return res(409, { message: "Já existe uma lead com esse ID." })
		await dynamo
			.put({
				TableName: "leads",
				Item: {
					id,
					nome,
					email,
					telefone,
					prospectSince: Date.now(),
					clientSince: false,
				},
			})
			.promise()
		return res(200, { message: "Lead criada!" })
	}
	return res(404, { error: "Rota não encontrada." })
}

const res = (
	statusCode = 200,
	body = {},
	headers = {
		"Content-Type": "application/json",
	}
) => {
	return { statusCode, body: JSON.stringify(body), headers }
}
