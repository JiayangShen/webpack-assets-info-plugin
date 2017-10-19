const isJS = file => /\.js(\?[^.]+)?$/.test(file)
const isCSS = file => /\.css(\?[^.]+)?$/.test(file)

function uniq(arr)
{
    const ret = []
    arr.forEach(e => {
        if(ret.indexOf(e) < 0) ret.push(e)
    })
    return ret
}

function WebpackAssetsPlugin(options = {})
{
    this.options = Object.assign({filename: 'assets.json'}, options)
}

WebpackAssetsPlugin.prototype.apply = function(compiler)
{
    compiler.plugin('emit', (compilation, cb) =>
    {
        const stats = compilation.getStats().toJson()
        
        const initialFiles = uniq(Object.keys(stats.entrypoints)
            .map(name => stats.entrypoints[name].assets)
            .reduce((assets, all) => all.concat(assets), []))
            
        const entryScripts = initialFiles.filter(isJS)
        const entryStyles = initialFiles.filter(isCSS)
        
        const asyncChunks = stats.chunks.filter(c => !c.entry && !c.initial)
            .map(chunk =>
            {
                const { id, size, files, hash, modules } = chunk;
                const file = files[0];
                const name = modules[0].name;
                const src = name.split(' ')[0];
                return { id, size, hash, src, file };
            })
        
        const assets = stats.modules.filter(m => m.assets.length)
            .map(m => ({
                src: m.name,
                file: m.assets[0],
                size: stats.assets.find(f => f.name == m.assets[0]).size
            }))
        
        const manifest = {
                publicPath: stats.publicPath,
                entryScripts,
                entryStyles,
                asyncChunks,
                assets
            }
        
        const json = JSON.stringify(manifest, null, 4)
        compilation.assets[this.options.filename] = {
            source: () => json,
            size: () => json.length
        }
        cb()
    })
}

module.exports = WebpackAssetsPlugin;















