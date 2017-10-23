'use strict'

const fs = require('fs')

const rs = fs.createReadStream(process.argv[2])

rs.on('error', error => console.error('ERROR!', error))
rs.pipe(process.stdout)
