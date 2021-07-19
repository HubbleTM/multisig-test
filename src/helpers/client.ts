//client.js
// Load Avalanche SDK components
import { Avalanche } from "avalanche"
import { NETWORK_ID } from "../resources/constants"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"

export const client = new Avalanche(ip, port, protocol, NETWORK_ID)
