let fs = require('fs')
let stats = [{
    ext: 'folder',
    count: 0
}]

//make ready
let arg = process.argv[2]
let sortChoice = process.argv[3]

if (!arg) {
    console.log("USE: node analyze.js [PATH] [-c or -s]")
    return
}

//put '\' after the dir name if not exist
if (!arg.endsWith("\\")) arg += "\\"

//main function
analyzeDir(arg)

//sort all the stuff accordingly
sortStuff()

//write to csv
writeToCSV()


function analyzeDir(dir) {
    let files
    try {
        files = fs.readdirSync(dir)
    } catch (err) {
        console.log(err.code + " -> " + err.path)
    }
    if (!files) return
    for (let i = 0; i < files.length; i++) {
        let file
        try {
            file = fs.statSync(dir + "\\" + files[i])
        } catch (err) {
            console.log(err.code + " -> " + err.path)
        }
        if (file) {
            if (file.isDirectory()) {
                let f = stats.find(x => x.ext === "folder")
                f.count += 1
                analyzeDir(dir + "\\" + files[i])
            } else {
                let ext = files[i].split(".")
                ext = ext[ext.length - 1]
                let f = stats.find(x => x.ext === ext)
                if (!f) {
                    f = {
                        ext: ext,
                        count: 1,
                        size: file.size
                    }
                    stats.push(f)
                } else {
                    f.count += 1
                    f.size += file.size
                }
            }
        }
    }
}

function sortStuff() {
    if (sortChoice === "-s" || !sortChoice) {
        stats.sort((a, b) => {
            return b.size - a.size
        })
    } else if (sortChoice === "-c" || !sortChoice) {
        stats.sort((a, b) => {
            return b.count - a.count
        })
    }
}

function writeToCSV() {
    let fname = arg.replace(":", "").replace(/\\/g, "_") + "_OUT.csv"
    let stream = fs.createWriteStream(fname)
    stream.once('open', function (fd) {
        let fol = stats.find(x => x.ext === "folder")
        let out = "folders;" + fol.count + ";\n"
        out += "type;count;size;\n"
        for (let i = 0; i < stats.length; i++) {
            let s = stats[i]
            console.log(s)
            if (s.ext !== "folder") {
                let size = "B"
                let fsize = s.size
                out += s.ext + ";" + s.count + ";"
                if (fsize / 1024 > 1) { //bigger than 1kB
                    fsize /= 1024
                    if (fsize / 1024 > 1) { //bigger than 1MB
                        fsize /= 1024
                        if (fsize / 1024 > 1) { //bigger than 1GB
                            size = "GB"
                        } else size = "MB"
                    } else "kB"
                }
                while (s.size / 1024 > 1)
                    s.size /= 1024
                s.size = Math.round(s.size * 100) / 100
                out += s.size + " " + size + "\n"
            }
        }
        stream.write(out)
        stream.end()
        console.log("------------------------\n\nfind CVS at " + fname + "\n\n------------------")
    })
}
