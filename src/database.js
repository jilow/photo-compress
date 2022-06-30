const JSONdb = require('simple-json-db');

class DatabaseConnection {
    constructor(path) {
        this.db = new JSONdb(path);
    }

    getData() {
        const images = (this.db.get('data') || []);
        const tags = this.db.get('tags') || [];

        return { images, tags };
    }

    insertImage({
        title,
        originalFilename,
        description,
        base64,
        small,
        large,
        metadata,
        tags,
    }) {
        const rows = this.db.get('data') || [];
        rows.push({
            id: rows.length + 1,
            title,
            originalFilename,
            description,
            base64,
            small,
            large,
            metadata,
            tags,
        });
        this.db.set('data', rows);
    }

    insertTags(tags) {
        if (!tags.length) return;

        const tagRows = new Set(this.db.get('tags') || []);
        tags.forEach(tag => tagRows.add(tag));
        this.db.set('tags', Array.from(tagRows));
    }

}

module.exports = DatabaseConnection;
