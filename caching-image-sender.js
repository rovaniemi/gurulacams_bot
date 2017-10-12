const Promise = require('bluebird')

const timestamp = () => new Date().getTime()

// type FileId = string
// type Photo = string | Buffer | Stream
// type Payload = Photo | FileId
class CachingImageSender {
    constructor(
        tgClient, // TelegramClient
        fetchPhoto, // () => Photo
        cacheLifetimeMs // number
    ) {
        this.tgClient = tgClient
        this.fetchPhoto = fetchPhoto
        this.cacheLifetime = cacheLifetimeMs

        this.lastUpdated = new Date(0).getTime() // number
        this.payload = null // Payload

        this.send = this.send.bind(this)
    }

    cacheIsValid() { // () => boolean
        const now = timestamp()
        const age = now - this.lastUpdated
        return age < this.cacheLifetime
    }

    updateCache() { // () => Promise<Photo>
        return this.fetchPhoto()
            .then(photo => {
                this.lastUpdated = timestamp()
                this.payload = photo
                return photo
            })
    }

    send(chatId) { // Promise<void>
        const replaceWithOrUpdateCache = payload => {
            return this.cacheIsValid() ? payload : this.updateCache()
        }

        return Promise.resolve(this.payload)
            .then(replaceWithOrUpdateCache)
            .then(payload => this.tgClient.sendPhoto(chatId, payload))
            .then(fileId => {
                this.payload = fileId
            })
    }
}

module.exports = { CachingImageSender }