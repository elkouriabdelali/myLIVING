!function(root, factory) {
    "object" == typeof exports ? module.exports = exports = factory(require("./core"), require("./enc-base64"), require("./md5"), require("./evpkdf"), require("./cipher-core")) : "function" == typeof define && define.amd ? define([ "./core", "./enc-base64", "./md5", "./evpkdf", "./cipher-core" ], factory) : factory(root.CryptoJS);
}(this, function(CryptoJS) {
    !function() {
        var C = CryptoJS;
        var C_lib = C.lib;
        var BlockCipher = C_lib.BlockCipher;
        var C_algo = C.algo;
        var SBOX = [];
        var INV_SBOX = [];
        var SUB_MIX_0 = [];
        var SUB_MIX_1 = [];
        var SUB_MIX_2 = [];
        var SUB_MIX_3 = [];
        var INV_SUB_MIX_0 = [];
        var INV_SUB_MIX_1 = [];
        var INV_SUB_MIX_2 = [];
        var INV_SUB_MIX_3 = [];
        !function() {
            var d = [];
            for (var i = 0; 256 > i; i++) d[i] = 128 > i ? i << 1 : i << 1 ^ 283;
            var x = 0;
            var xi = 0;
            for (var i = 0; 256 > i; i++) {
                var sx = xi ^ xi << 1 ^ xi << 2 ^ xi << 3 ^ xi << 4;
                sx = sx >>> 8 ^ 255 & sx ^ 99;
                SBOX[x] = sx;
                INV_SBOX[sx] = x;
                var x2 = d[x];
                var x4 = d[x2];
                var x8 = d[x4];
                var t = 257 * d[sx] ^ 16843008 * sx;
                SUB_MIX_0[x] = t << 24 | t >>> 8;
                SUB_MIX_1[x] = t << 16 | t >>> 16;
                SUB_MIX_2[x] = t << 8 | t >>> 24;
                SUB_MIX_3[x] = t;
                var t = 16843009 * x8 ^ 65537 * x4 ^ 257 * x2 ^ 16843008 * x;
                INV_SUB_MIX_0[sx] = t << 24 | t >>> 8;
                INV_SUB_MIX_1[sx] = t << 16 | t >>> 16;
                INV_SUB_MIX_2[sx] = t << 8 | t >>> 24;
                INV_SUB_MIX_3[sx] = t;
                if (x) {
                    x = x2 ^ d[d[d[x8 ^ x2]]];
                    xi ^= d[d[xi]];
                } else x = xi = 1;
            }
        }();
        var RCON = [ 0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54 ];
        var AES = C_algo.AES = BlockCipher.extend({
            _doReset: function() {
                var key = this._key;
                var keyWords = key.words;
                var keySize = key.sigBytes / 4;
                var nRounds = this._nRounds = keySize + 6;
                var ksRows = 4 * (nRounds + 1);
                var keySchedule = this._keySchedule = [];
                for (var ksRow = 0; ksRows > ksRow; ksRow++) if (keySize > ksRow) keySchedule[ksRow] = keyWords[ksRow]; else {
                    var t = keySchedule[ksRow - 1];
                    if (ksRow % keySize) keySize > 6 && ksRow % keySize == 4 && (t = SBOX[t >>> 24] << 24 | SBOX[t >>> 16 & 255] << 16 | SBOX[t >>> 8 & 255] << 8 | SBOX[255 & t]); else {
                        t = t << 8 | t >>> 24;
                        t = SBOX[t >>> 24] << 24 | SBOX[t >>> 16 & 255] << 16 | SBOX[t >>> 8 & 255] << 8 | SBOX[255 & t];
                        t ^= RCON[ksRow / keySize | 0] << 24;
                    }
                    keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
                }
                var invKeySchedule = this._invKeySchedule = [];
                for (var invKsRow = 0; ksRows > invKsRow; invKsRow++) {
                    var ksRow = ksRows - invKsRow;
                    if (invKsRow % 4) var t = keySchedule[ksRow]; else var t = keySchedule[ksRow - 4];
                    invKeySchedule[invKsRow] = 4 > invKsRow || 4 >= ksRow ? t : INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[t >>> 16 & 255]] ^ INV_SUB_MIX_2[SBOX[t >>> 8 & 255]] ^ INV_SUB_MIX_3[SBOX[255 & t]];
                }
            },
            encryptBlock: function(M, offset) {
                this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
            },
            decryptBlock: function(M, offset) {
                var t = M[offset + 1];
                M[offset + 1] = M[offset + 3];
                M[offset + 3] = t;
                this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);
                var t = M[offset + 1];
                M[offset + 1] = M[offset + 3];
                M[offset + 3] = t;
            },
            _doCryptBlock: function(M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
                var nRounds = this._nRounds;
                var s0 = M[offset] ^ keySchedule[0];
                var s1 = M[offset + 1] ^ keySchedule[1];
                var s2 = M[offset + 2] ^ keySchedule[2];
                var s3 = M[offset + 3] ^ keySchedule[3];
                var ksRow = 4;
                for (var round = 1; nRounds > round; round++) {
                    var t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[s1 >>> 16 & 255] ^ SUB_MIX_2[s2 >>> 8 & 255] ^ SUB_MIX_3[255 & s3] ^ keySchedule[ksRow++];
                    var t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[s2 >>> 16 & 255] ^ SUB_MIX_2[s3 >>> 8 & 255] ^ SUB_MIX_3[255 & s0] ^ keySchedule[ksRow++];
                    var t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[s3 >>> 16 & 255] ^ SUB_MIX_2[s0 >>> 8 & 255] ^ SUB_MIX_3[255 & s1] ^ keySchedule[ksRow++];
                    var t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[s0 >>> 16 & 255] ^ SUB_MIX_2[s1 >>> 8 & 255] ^ SUB_MIX_3[255 & s2] ^ keySchedule[ksRow++];
                    s0 = t0;
                    s1 = t1;
                    s2 = t2;
                    s3 = t3;
                }
                var t0 = (SBOX[s0 >>> 24] << 24 | SBOX[s1 >>> 16 & 255] << 16 | SBOX[s2 >>> 8 & 255] << 8 | SBOX[255 & s3]) ^ keySchedule[ksRow++];
                var t1 = (SBOX[s1 >>> 24] << 24 | SBOX[s2 >>> 16 & 255] << 16 | SBOX[s3 >>> 8 & 255] << 8 | SBOX[255 & s0]) ^ keySchedule[ksRow++];
                var t2 = (SBOX[s2 >>> 24] << 24 | SBOX[s3 >>> 16 & 255] << 16 | SBOX[s0 >>> 8 & 255] << 8 | SBOX[255 & s1]) ^ keySchedule[ksRow++];
                var t3 = (SBOX[s3 >>> 24] << 24 | SBOX[s0 >>> 16 & 255] << 16 | SBOX[s1 >>> 8 & 255] << 8 | SBOX[255 & s2]) ^ keySchedule[ksRow++];
                M[offset] = t0;
                M[offset + 1] = t1;
                M[offset + 2] = t2;
                M[offset + 3] = t3;
            },
            keySize: 8
        });
        C.AES = BlockCipher._createHelper(AES);
    }();
    return CryptoJS.AES;
});