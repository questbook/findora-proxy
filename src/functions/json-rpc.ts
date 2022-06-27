import { Boom } from "@hapi/boom";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import axios from "axios";

export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
    try {
        const jsonReq = tryJSONParse(event.body)
        const processedReq = postProcessRequest(jsonReq)

        const jsonRes = await sendRPC(processedReq)

        return {
            body: JSON.stringify(jsonRes),
            statusCode: 200
        }
    } catch (error) {
        console.error(`error in request`, event.body, error)
        return {
            body: { error: error.message },
            statusCode: 500
        }
    }
}

const sendRPC = async (req: any) => {
    const result = await axios.post(
        'https://prod-testnet.prod.findora.org:8545/',
        req,
        {
            responseType: 'json',
            validateStatus: status => status === 200
        }
    )
    console.log('result: ', result)
    return result.data
}


const postProcessRequest = (req: any) => { 
    if (req.method === 'eth_getBlockByNumber') {
        if (req.params[0] === '0x0' || req.params.toString() === '0') {
            req.params[0] = '0x1'
        }
    }
    return req
}


const tryJSONParse = (body: string | null | undefined) => {
    try {
        if (!body) {
            throw new Boom('no body present')
        }
        return JSON.parse(body)
    } catch (error) {
        throw new Boom('Invalid JSON', { statusCode: 400, data: { message: error.message } })
    }
}
