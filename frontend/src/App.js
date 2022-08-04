import idl from './idl.json'
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Program, AnchorProvider, web3, utils, BN } from '@project-serum/anchor'
import './App.css';
import { useEffect, useState } from 'react';
import { Buffer } from 'buffer'
window.Buffer = Buffer

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null)
  const [compaigns, setCompaigns] = useState([])

  const getProvider = () => {
    const prodramId = new PublicKey(idl.metadata.address)
    const network = clusterApiUrl('devnet')
    const opts = { preflightCommitment: 'processed' }
    const connection = new Connection(network, opts.preflightCommitment)
    const provider = new AnchorProvider(connection, window.solana, opts.preflightCommitment)

    const program = new Program(idl, prodramId, provider)

    return { connection, provider, program }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window
      if (solana) {
        if (solana.isPhantom) {
          console.log('=====> Phantom Wallet found.')
          const response = await solana.connect({ onlyIfTrusted: true })
          console.log('=====> Connect with Publickey: ', response.publicKey.toString())
          setWalletAddress(response.publicKey.toString())
        } else {
          alert('Solana object notfound, please install phantom wallet.')
        }
      }
    } catch (error) {
      console.error('===> Error', error)
    }
  };

  const connectToWallet = async () => {
    const { solana } = window
    if (solana) {
      const responce = await solana.connect();
      console.log('connect with publickey: ', responce.publicKey.toString())
      setWalletAddress(responce.publicKey.toString())
    }
  }
  const createCompaign = async () => {
    try {
      const { connection, provider, program } = getProvider()
      const [compaign] = await PublicKey.findProgramAddress([
        utils.bytes.utf8.encode("any string"),
        provider.wallet.publicKey.toBuffer()
      ], program.programId)

      await program.rpc.initialize('compaign name', 'compaign description', {
        accounts: {
          compaign,
          user: provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId
        }
      })

      console.log('Create new compaign: ', compaign.toString())
    } catch (error) {
      console.error(' Error', error)
    }
  }

  const getCompaign = async () => {
    const { connection, provider, program } = getProvider()
    Promise.all((await connection.getProgramAccounts(program.programId))
    .map(async (compaign) => ({...(await program.account.compaign.fetch(compaign.pubkey)), pubkey: compaign.pubkey})
    )).then((compaigns) => setCompaigns(compaigns))
  }

  const donate = async (publicKey) => {
    try{
      const { connection, provider, program } = getProvider()
      await program.rpc.donate(new BN(0.2 * LAMPORTS_PER_SOL), {
        accounts: {
          compaign: publicKey,
          user: provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        }
      })

      console.log('Donate to Compaign: ', publicKey.toString())
      getCompaign()
    } catch (error) {
      console.error('Error', error)
    }
  }

  const withdraw = async (publicKey) => {
    try{
      const { connection, provider, program } = getProvider()
      program.rpc.withdraw(new BN(0.2 * LAMPORTS_PER_SOL), {
        accounts: {
          compaign: publicKey,
          user: provider.wallet.publicKey,
        }
      })
      console.log('withdraw to: ', provider.wallet.publicKey.toBase58())
      getCompaign()
    } catch (error) {
      console.error('Error', error)
    }
  }


  const renderNotConnectedContainer = () => {
    return <button onClick={connectToWallet}> Connect to Wallet </button>
  }

  const renderConnectedContainer = () => {
    return <>
    <button onClick={createCompaign}> Create New Compaign </button>
    <button onClick={getCompaign}> Get All Compaigns </button>
    <br/>
    {compaigns.map(compaign => (<>
    <p>Compaign Id: {compaign.pubkey.toString()}</p>
    <p>Compaign Balance: {(compaign.amountDonated / LAMPORTS_PER_SOL).toString()}</p>
    <p>{compaign.name}</p>
    <p>{compaign.description}</p>
    <button onClick={() => donate(compaign.pubkey)}>Click to Donate</button>
    <button onClick={() => withdraw(compaign.pubkey)}>Click to Withdraw</button>
    <br/>
    </>))}
    </>
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected()
    }
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, []);

  return <div className='App'>
    {!walletAddress && renderNotConnectedContainer()}
    {walletAddress && renderConnectedContainer()}
  </div>
}

export default App;
