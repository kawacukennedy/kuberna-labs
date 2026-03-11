const fs = require('fs');
const path = require('path');
const solc = require('solc');

const contractFiles = [
    'AgentRegistry.sol',
    'Attestation.sol',
    'CertificateNFT.sol',
    'CourseNFT.sol',
    'CrossChainRouter.sol',
    'Dispute.sol',
    'Escrow.sol',
    'FeeManager.sol',
    'GovernanceToken.sol',
    'Intent.sol',
    'Multisig.sol',
    'Payment.sol',
    'PriceOracle.sol',
    'ReputationNFT.sol',
    'Subscription.sol',
    'Treasury.sol',
    'Vesting.sol',
    'Workshop.sol'
];

const contractsDir = path.join(__dirname, 'contracts');

const input = {
    language: 'Solidity',
    sources: {},
    settings: {
        optimizer: {
            enabled: true,
            runs: 200
        },
        viaIR: true,
        outputSelection: {
            '*': {
                '*': ['*']
            }
        }
    }
};

function findImports(relativePath) {
    // Handle OpenZeppelin and Chainlink imports
    if (relativePath.startsWith('@openzeppelin/') || relativePath.startsWith('@chainlink/')) {
        const fullPath = path.join(__dirname, 'node_modules', relativePath);
        try {
            return { contents: fs.readFileSync(fullPath, 'utf8') };
        } catch (e) {
            return { error: 'File not found: ' + fullPath };
        }
    }
    // Handle local imports
    const fullPath = path.join(contractsDir, relativePath);
    try {
        return { contents: fs.readFileSync(fullPath, 'utf8') };
    } catch (e) {
        return { error: 'File not found: ' + fullPath };
    }
}

console.log('Loading contracts...');
contractFiles.forEach(file => {
    const filePath = path.join(contractsDir, file);
    if (fs.existsSync(filePath)) {
        input.sources[file] = {
            content: fs.readFileSync(filePath, 'utf8')
        };
        console.log(`- ${file} loaded`);
    } else {
        console.warn(`- ${file} not found, skipping`);
    }
});

console.log('Compiling contracts individually...');
contractFiles.forEach(file => {
    const individualInput = {
        language: 'Solidity',
        sources: {
            [file]: input.sources[file]
        },
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            viaIR: true,
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            }
        }
    };

    console.log(`Compiling ${file}...`);
    try {
        const output = JSON.parse(solc.compile(JSON.stringify(individualInput), { import: findImports }));

        if (output.errors) {
            let hasErrors = false;
            output.errors.forEach(err => {
                if (err.severity === 'error') {
                    console.error(err.formattedMessage);
                    hasErrors = true;
                } else {
                    console.warn(err.formattedMessage);
                }
            });
            if (hasErrors) {
                console.error(`- ${file} compilation failed.`);
                process.exit(1);
            }
        }
        console.log(`- ${file} compilation successful!`);
    } catch (e) {
        console.error(`- ${file} failed with exception: ${e.message}`);
        process.exit(1);
    }
});

console.log('All contracts compiled successfully!');
