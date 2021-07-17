//client.js
// Load Avalanche SDK components
import { Avalanche } from 'avalanche';
import { URL } from 'url';
import { NODE_URL, NETWORK_ID, NETWORK_NAME } from '../resources/constants';

// Configure Avalanche client from the DataHub url
const url = new URL(NODE_URL);

const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;

export const client = new Avalanche(ip, port, protocol, networkID);
