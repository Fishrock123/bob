'use strict'

const BindFileSource = require('../../addons/fs-source/build/Release/addon')
const BindFileSink = require('../../addons/fs-sink/build/Release/addon')
const PassThrough = require('../../addons/passthrough/build/Release/addon')

// const fileSink = new FileSink(process.argv[2] + '_')
const sourcePT = new PassThrough()
const sinkPT = new PassThrough()

// weird but node core is weird, too
BindFileSource(sourcePT, process.argv[2])

sinkPT.bindSource(sourcePT)

BindFileSink(sinkPT, process.argv[2] + '_')

// fileSink.bindSource(passThrough, error => {
//   if (error)
//     console.error('ERROR!', error)
//   else {
//     console.log('done')
//   }
// })
