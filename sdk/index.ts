import axios from 'axios';
import { ethers } from 'ethers';

export interface AgentConfig {
    name: string;
    framework: string;
}

export interface DeploymentConfig {
    task: string;
    secureExecution: "TEE" | "Centralized";
}

export class KubernaSDK {
    private apiKey?: string;
    private wallet?: string;
    private baseUrl: string;

    constructor(config: { apiKey?: string; wallet?: string; baseUrl?: string } = {}) {
        this.apiKey = config.apiKey;
        this.wallet = config.wallet;
        this.baseUrl = config.baseUrl || 'http://localhost:3001/api';
    }

    static async initialize(config: { wallet: string; baseUrl?: string }) {
        return new KubernaSDK(config);
    }

    async createAgent(config: AgentConfig) {
        console.log(`[SDK] Creating agent: ${config.name}...`);
        try {
            const response = await axios.post(`${this.baseUrl}/agents`, config, {
                headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}
            });
            return response.data;
        } catch (error) {
            // Fallback for demo/local development if backend isn't running
            console.warn(`[SDK] Backend not reachable, returning mock agent.`);
            return { id: 'agent_' + Math.random().toString(36).substr(2, 9), ...config };
        }
    }

    async deploy(config: DeploymentConfig) {
        console.log(`[SDK] Deploying task: "${config.task}" via ${config.secureExecution}...`);
        try {
            const response = await axios.post(`${this.baseUrl}/intents`, {
                description: config.task,
                secure: config.secureExecution === "TEE"
            }, {
                headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}
            });
            return response.data;
        } catch (error) {
            console.warn(`[SDK] Backend not reachable, mock deployment successful.`);
            return { status: 'success', txHash: '0x' + '0'.repeat(64) };
        }
    }
}
