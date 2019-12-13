/*
Copyright 2019 Adobe Inc. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

// const { stdout } = require('stdout-stderr')
const TheCommand = require('../../../src/commands/certificate/')

test('exports', async () => {
  expect(typeof TheCommand).toEqual('function')
})

test('description', async () => {
  expect(TheCommand.description).toBeDefined()
})

describe('instance methods', () => {
  let command

  beforeEach(() => {
    command = new TheCommand([])
  })

  test('run', async () => {
    expect(TheCommand.run).toBeDefined()
    expect(command.run).toBeDefined()
    command.argv = []
    let result = command.run()
    // todo: fix this test, it actually should NOT throw, and simply output some help text
    await expect(result).rejects.toThrow()
  })
})