/*
Copyright 2019 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const { Command, flags } = require('@oclif/command')
const fs = require('fs-extra')
const debug = require('debug')('aio-cli-plugin-certificate:generate')
const forge = require('node-forge')
const pki = forge.pki

/**
  openssl req -x509 -sha256 -nodes -days 365 -subj "/C=US/" -newkey rsa:2048 -keyout private.key -out certificate_pub.crt
  -x509          output a x509 structure instead of a cert. req.
  -nodes         don't encrypt the output key
  -days          number of days a certificate generated by -x509 is valid for.
  -subj arg      set or modify request subject
  -newkey rsa:bits generate a new RSA key of 'bits' in size
  -keyout arg    file to send the key to
  -out arg       output file
*/

function generateCertificate (commonName, countryName, stateName, cityName, orgName, orgUnit, days) {
  debug('generating a certificate with ', [commonName, countryName, stateName, cityName, orgName, orgUnit])
  // generate a keypair

  const keys = pki.rsa.generateKeyPair(2048)
  // create a new certificate
  const cert = pki.createCertificate()

  // fill the required fields
  cert.publicKey = keys.publicKey
  cert.serialNumber = Date.now().toString()
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setDate(cert.validity.notAfter.getDate() + days)

  const attrs = []

  attrs.push({ name: 'commonName', value: commonName })

  if (countryName) {
    attrs.push({ name: 'countryName', value: countryName })
  }

  if (stateName) {
    attrs.push({ shortName: 'ST', value: stateName })
  }

  if (cityName) {
    attrs.push({ name: 'localityName', value: cityName })
  }

  if (orgName) {
    attrs.push({ name: 'organizationName', value: orgName })
  }

  if (orgUnit) {
    attrs.push({ shortName: 'OU', value: orgUnit })
  }

  // set subject and issuer
  cert.setSubject(attrs)
  cert.setIssuer(attrs)

  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: false
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true
    }
  ])

  // sign the cert
  cert.sign(keys.privateKey, forge.md.sha256.create())
  const pk = pki.privateKeyToPem(keys.privateKey)
  debug('generated private key')
  // convert cert to PEM format
  const pemCert = pki.certificateToPem(cert)
  return {
    privateKey: pk,
    cert: pemCert
  }
}

class GenerateCommand extends Command {
  async run () {
    const { flags } = this.parse(GenerateCommand)
    if (fs.existsSync(flags.keyout)) {
      this.error('--keyout file exists: ' + flags.keyout)
    }
    if (fs.existsSync(flags.out)) {
      this.error('--out file exists: ' + flags.out)
    }

    const keyPair = generateCertificate(flags.name, flags.country, flags.state, flags.locality, flags.organization, flags.unit, flags.days)
    fs.writeFileSync(flags.keyout, keyPair.privateKey)
    fs.writeFileSync(flags.out, keyPair.cert)
    this.log('success: generated certificate')
  }
}

GenerateCommand.description = `Generate a new private/public key pair
Generate a self-signed certificate to enable https:// on localhost or signing jwt payloads for interacting with Adobe services.
`

GenerateCommand.flags = {
  keyout: flags.string({
    description: 'file to send the key to',
    default: 'private.key'
  }),
  out: flags.string({
    description: 'output file',
    default: 'certificate_pub.crt'
  }),
  name: flags.string({
    char: 'n',
    description: 'Common Name: typically a host domain name, like www.mysite.com',
    default: 'selfsign.localhost'
  }),
  country: flags.string({
    char: 'c',
    description: 'Country Name'
  }),
  state: flags.string({
    char: 's',
    description: 'State or Province'
  }),
  locality: flags.string({
    char: 'l',
    description: 'Locality, or city name'
  }),
  organization: flags.string({
    char: 'o',
    description: 'Organization name'
  }),
  unit: flags.string({
    char: 'u',
    description: 'Organizational unit or department'
  }),
  days: flags.integer({
    description: 'Number of days the certificate should be valid for. (Max 365)',
    default: 365
  })
}

module.exports = GenerateCommand
