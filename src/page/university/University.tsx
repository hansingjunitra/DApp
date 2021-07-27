import { useEffect, useState, useCallback } from 'react';
import {
  Tab,
  Tabs,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
} from '@material-ui/core';
import grey from '@material-ui/core/colors/grey';
import debounce from 'lodash/debounce';
import { useContract, useWeb3 } from '@services/contract/web3';
import { Certificate } from '@param/certificate';

const University: Function = () => {
  const [accountAddress, setAccountAddress] = useState('');
  const [error, setError] = useState(false);

  const [certificate, setCertificate] = useState<Certificate>({
    name: "",
    course: "",
    degree: "",
    graduatingYear: "",
    enrolledYear: "",
    recipient: ""
  })

  const inputChangeHandler = (evt: any) => {
    const value = evt.target.value;
    setCertificate({
      ...certificate,
      [evt.target.name]: value
    });
  }

  const [metamaskEnabled, setMetamaskEnabled] = useState(false);
  const web3Ref = useWeb3();
  const contractRef = useContract(web3Ref.current);

  const getAddressFromMetamask = async () => {
    const [account]: string[] = await (window as any).ethereum.request({
      method: 'eth_requestAccounts',
    });
    web3Ref.current.eth.defaultAccount = account;
    contractRef.current.defaultAccount = account;
    setAccountAddress(account);
  };

  const metamaskConnect = () => {
    if ((window as any).ethereum === undefined) {
      console.error('METAMASK IS NOT INSTALLED');
      return;
    }
    if (metamaskEnabled) {
      return;
    }
    setMetamaskEnabled(true);
    getAddressFromMetamask();
    (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length) setAccountAddress(accounts[0]);
      web3Ref.current.eth.defaultAccount = accounts[0];
      contractRef.current.defaultAccount = accounts[0];
    });
  };

  // useEffect(() => {
  // setAccountAddress('0x6D18286412a443CfC95d90fBB0D2F81c54455948');
  // console.log(web3.eth.getAccounts(console.log));
  // web3.eth.defaultAccount = '0x6D18286412a443CfC95d90fBB0D2F81c54455948';
  // contract.methods
  //   .getAllMyCertificates()
  //   .call({ from: accountAddress }, (err: any, res: any) => res)
  //   .then((res: any) => console.log(res));
  // }, []);

  const issueCertificate = async () => {
    if (error) return;
    console.log(certificate);
    web3Ref.current.eth.defaultAccount = accountAddress;
    contractRef.current.defaultAccount = accountAddress;
    const result: boolean = await contractRef.current.methods
        .issueCertificate(
            certificate.name,
            certificate.course,
            certificate.degree,
            certificate.graduatingYear,
            certificate.enrolledYear, 
            certificate.recipient
        )
        .call();
    console.log(result)
    // setCertificateList(results);
  };

  const validateAddress = useCallback(
    debounce((addr: string) => {
      setError(!web3Ref.current.utils.isAddress(addr));
    }, 200),
    []
  );
  useEffect(() => {
    if (accountAddress) validateAddress(accountAddress);
  }, [accountAddress, validateAddress]);

  return (
    <Box>
        <Box mb={2}>
            <Typography variant="h4" style={{ margin: '16px 0px' }}>
                Student Main Page
            </Typography>
            <TextField
            label="Wallet Address"
            placeholder="0x5e971afc039cf29738eff1242db39c3bd4a02ce9"
            value={accountAddress}
            error={error}
            helperText={error ? 'Invalid Address' : ''}
            onChange={(e) => {
                setAccountAddress(e.target.value);
            }}
            variant="outlined"
            fullWidth
            style={{ width: '500px' }}
            />
        </Box>
        <Box mb={6}>
            <Box mb={1}>
            <Button
                onClick={metamaskEnabled ? getAddressFromMetamask : metamaskConnect}
                color="secondary"
                variant="contained"
            >
                {metamaskEnabled ? 'Import from Metamask' : 'Use Metamask'}
            </Button>
            </Box>
        </Box>
        <Box mb={6} style = {{flexDirection: 'column', width : '50%', margin:'auto'}}>
            <Box mb = {2}>
                <TextField name = "name" label="Recipient Name" variant="outlined" fullWidth onChange = {inputChangeHandler}></TextField>
                {/* <TextField name = "institutionName" label="Institution Name" variant="outlined" fullWidth onChange = {inputChangeHandler}></TextField> */}
                <TextField name = "course" label="Course" variant="outlined" fullWidth onChange = {inputChangeHandler}></TextField>
                <TextField name = "degree" label="Degree" variant="outlined" fullWidth onChange = {inputChangeHandler}></TextField>
                <TextField name = "enrolledYear" label="Enrolled Year" variant="outlined" fullWidth onChange = {inputChangeHandler}></TextField>
                <TextField name = "graduatingYear" label="Graduating Year" variant="outlined" fullWidth  onChange = {inputChangeHandler}></TextField>
                {/* <TextField name = "issuer" label="Issuer" variant="outlined" fullWidth onChange = {inputChangeHandler}></TextField> */}
                <TextField name = "recipient" label="Recipient Address" variant="outlined" fullWidth onChange = {inputChangeHandler}></TextField>
            </Box>
        </Box>
        <Box mb={6}>
            <Box mb={1}>
                <Button
                    onClick={issueCertificate}
                    color="primary"
                    variant="contained"
                >
                    Issue Certificate
                </Button>
            </Box>
        </Box>
    </Box>
  );
};

export { University };
