import {
    clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemInstruction,
    SystemProgram,
    SYSVAR_CLOCK_PUBKEY,
    Transaction,
    TransactionInstruction
} from '@solana/web3.js';

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const programId = new PublicKey('78YbEWNqEd1zuYcbUA8qp1NYrjRsXGUzPbZxSUedziLu');
// 3axXCpVdty6Jd77YGpgDovJta3x1ytg2vp9jvQQBTNfY
const funder = Keypair.fromSecretKey(
    Buffer.from(
        'afcd8be7c4e9917d569797b57d51469946a1e87eb7e53c3094dbcb66fd51f3b3266a516d039fdc7ac81b268ccd1fbbaa5fc0aac75c6492133a98943f3067a2ff',
        'hex'
    )
);

let drift = 0;
const search = /unix_timestamp = (\d+)/;

async function poll(funder: Keypair) {
    const balance = await connection.getBalance(funder.publicKey);
    if (balance < 50_000) {
        await connection.requestAirdrop(funder.publicKey, LAMPORTS_PER_SOL);
    }

    const now = Math.floor(new Date().getTime() / 1000);
    const tx = new Transaction().add(
        new TransactionInstruction({
            programId,
            keys: [
                {
                    pubkey: SYSVAR_CLOCK_PUBKEY,
                    isSigner: false,
                    isWritable: false
                }
            ]
        })
    );

    tx.feePayer = funder.publicKey;

    const sig = await sendAndConfirmTransaction(connection, tx, [funder]);
    const ctx = await connection.getConfirmedTransaction(sig);

    if (ctx === null) {
        console.log(`${now} transaction not found ${sig}`);
        return;
    }

    let solanaTime = 0;
    for (const line of ctx.meta?.logMessages || []) {
        const match = line.match(search);
        if (match) {
            solanaTime = parseInt(match[1]);
        }
    }

    let err = '';
    if (solanaTime == 0) {
        err = `, unable to get solana time: ${sig}`;
    }

    const drift = solanaTime - now;
    console.log(`server: ${now}, solana: ${solanaTime}, drift: ${drift}${err}`);
}

setInterval(poll.bind(null, funder), 5000);
