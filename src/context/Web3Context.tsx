import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { ManufacturerRegistryABI } from '../contracts/abis/ManufacturerRegistry';
import { UserMarketplaceABI } from '../contracts/abis/UserMarketplace';

interface Web3State {
  account: string | null;
  balance: string;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  contracts: {
    registry: ethers.Contract | null;
    marketplace: ethers.Contract | null;
  };
  connect: () => Promise<void>;
  disconnect: () => void;
}

const Web3Context = createContext<Web3State | undefined>(undefined);

const SEPOLIA_CHAIN_ID = 11155111;

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contracts, setContracts] = useState<{
    registry: ethers.Contract | null;
    marketplace: ethers.Contract | null;
  }>({ registry: null, marketplace: null });

  const updateBalance = useCallback(async (acc: string, prov: ethers.BrowserProvider) => {
    try {
      const bal = await prov.getBalance(acc);
      setBalance(ethers.formatEther(bal));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }, []);

  const initContracts = useCallback((currentSigner: ethers.JsonRpcSigner) => {
    const registryAddress = import.meta.env.VITE_MANUFACTURER_REGISTRY;
    const marketplaceAddress = import.meta.env.VITE_USER_MARKETPLACE;

    if (registryAddress && marketplaceAddress) {
      const registry = new ethers.Contract(registryAddress, ManufacturerRegistryABI, currentSigner);
      const marketplace = new ethers.Contract(marketplaceAddress, UserMarketplaceABI, currentSigner);
      setContracts({ registry, marketplace });
    }
  }, []);

  const connect = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await browserProvider.getNetwork();
      
      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ethers.toBeHex(SEPOLIA_CHAIN_ID) }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            alert('Please add Sepolia network to MetaMask');
          }
           throw switchError;
        }
      }

      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const currentSigner = await browserProvider.getSigner();
      
      setProvider(browserProvider);
      setSigner(currentSigner);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      
      initContracts(currentSigner);
      await updateBalance(accounts[0], browserProvider);
      
      localStorage.setItem('web3_connected', 'true');
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setSigner(null);
    setContracts({ registry: null, marketplace: null });
    localStorage.removeItem('web3_connected');
  };

  useEffect(() => {
    if (localStorage.getItem('web3_connected') === 'true') {
      connect();
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (provider) updateBalance(accounts[0], provider);
        } else {
          disconnect();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, [provider, updateBalance]);

  return (
    <Web3Context.Provider
      value={{
        account,
        balance,
        chainId,
        isConnected: !!account,
        isConnecting,
        provider,
        signer,
        contracts,
        connect,
        disconnect,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
