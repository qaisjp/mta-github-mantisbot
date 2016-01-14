var http = require('http')
var createHandler = require('github-webhook-handler')
var handler = createHandler({
	path: '/webhook',
	secret: require('fs').readFileSync('secret',{encoding:'utf8'}).slice(0, -1)
})

http.createServer(function (req, res) {
	handler(req, res, function (err) {
		res.statusCode = 404
		res.end('no such location')
	})
}).listen(7777)

handler.on('error', function (err) {
	console.error('Error:', err.message)
})

handler.on('ping', function(event) {
	console.log('Ping!')
})

handler.on('push', function (event) {
	console.log('Received a push event for %s to %s',
		event.payload.repository.name,
		event.payload.ref
	)
})