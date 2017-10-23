'use strict'

const FileSource = require('../fs/file-source')
const stdoutSink = require('../stdio/stdout-sink')

const fileSource = new FileSource(process.argv[2])
stdoutSink(error => console.error('ERROR!', error))(fileSource.read.bind(fileSource))
