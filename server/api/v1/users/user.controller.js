const co = require('co');
const ba = require('blockapps-rest');
const rest = ba.rest6;
const common = ba.common;
const fsutil = ba.common.fsutil;
const config = common.config;
const util = common.util;
const path = require('path');
const serverPath = './server';
const dappJs = require(`${path.join(process.cwd(), serverPath)}/dapp/dapp.js`);
const BigNumber = common.BigNumber
const constants = common.constants
const yaml = require('js-yaml');
const fs = require('fs');
const utils = require('../../../utils');

const usersController = {
  getBalance: function (req, res) {
    const chainId = req.query['chainId'];
    const accessToken = utils.getAccessTokenFromCookie(req);

    const deploy = fsutil.yamlSafeLoadSync(config.deployFilename, config.apiDebug);
    const data = deploy[chainId];
    const address = decodeURI(req.params['address']);

    co(function* () {
      const dapp = yield dappJs.setContract(accessToken, data.contract, chainId);
      const balance = yield dapp.getBalance(address, chainId);

      util.response.status200(res, {
        // this is a bignumber
        balance: balance,
        balanceString: new BigNumber(balance).div(constants.ETHER).toFixed(2)
      });
    }).catch(err => {
      console.log('User Balance Error:', err);
      util.response.status500(res, 'Could not get user balance');
    });
  },
  get: function (req, res) {
    const { chainId } = req.query;
    const { address } = req.params;
    const accessToken = utils.getAccessTokenFromCookie(req);

    co(function* () {
      const deploy = fsutil.yamlSafeLoadSync(config.deployFilename, config.apiDebug);
      const data = deploy[chainId];

      if (!data) {
        util.response.status(401, res, 'Contracts are not deployed on this chain! please deploy contracts first');
      } else {
        const dapp = yield dappJs.setContract(accessToken, data.contract, chainId);
        const result = yield dapp.getUserByAccount(address, chainId);
        util.response.status200(res, result);
      }

    }).catch(err => {
      console.log('Failed:', err);
      util.response.status(401, res, 'Failed to fetch user');
    });    
  }
}

module.exports = usersController;
