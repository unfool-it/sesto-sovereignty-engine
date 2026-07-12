export class SovereigntyError extends Error {
    constructor(public message: string, public code: string = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class SecurityError extends SovereigntyError {
    constructor(message: string) {
        super(message, 'SECURITY_VIOLATION');
    }
}

export class AssetError extends SovereigntyError {
    constructor(message: string) {
        super(message, 'ASSET_INVALID');
    }
}

export class ConfigError extends SovereigntyError {
    constructor(message: string) {
        super(message, 'CONFIGURATION_INVALID');
    }
}
