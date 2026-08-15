"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@prisma/config");
exports.default = (0, config_1.defineConfig)({
    schema: {
        kind: 'single',
        filePath: 'prisma/schema.prisma',
    },
    client: {
        generator: {
            provider: 'prisma-client-js',
        }
    }
});
//# sourceMappingURL=prisma.config.js.map