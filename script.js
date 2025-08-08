let songs, artists, genres, playlists
let is_song_played = false
let is_library_added = false
let is_song_added = false
let is_muted = false
let hovered_song_id = -1
let current_songs = []
let current_song = undefined
let current_artist = undefined
let total_duration;
let current_duration = 0;
let current_volume = 100;
let on_loop = false;
let timeline_interval
let current_song_element = undefined
let current_list = ""
let selected_lib = -1

async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadJSON(path) {
    return new Promise((resolve, reject) => {
        fetch(path)
            .then(response => response.text())
            .then(text => {
                const data = JSON.parse(text);
                console.log(data);
                resolve(data)
            });
    })
}

async function loadData() {
    songs = await loadJSON("files/data/songs.json")
    artists = await loadJSON("files/data/artists.json")
    genres = await loadJSON("files/data/genres.json")
    libraries = await loadJSON("files/data/libraries.json")
}

function updateDuration() {
    let minutes_part = Math.floor(current_duration / 60)
    let seconds_part = Math.floor(current_duration % 60)
    document.getElementById('current-time-duration').textContent = `${minutes_part}:${(seconds_part < 10) ? `0${seconds_part}` : `${seconds_part}`}`

    document.getElementById('timeline-slider').value = (current_duration / total_duration) * 100
    timeline_slider = document.getElementById('timeline-slider')
    document.getElementById('timeline-slider').style.background = `linear-gradient(90deg, #08c240 ${timeline_slider.value}%, white ${timeline_slider.value}%)`
}

function continueSong() {
    document.getElementById('current-music').remove()

    document.querySelector('body').insertAdjacentHTML('beforeend', `<audio id="current-music" src="files/media/songs/song-${current_song['id']}.mp3"></audio>"`)
    console.log(document.getElementById('current-music'))
    document.getElementById('current-music').currentTime = current_duration
    updateVolume()
    document.getElementById('current-music').play()

    clearInterval(timeline_interval)

    timeline_interval = setInterval(() => {
        let new_current_time = document.getElementById('current-music').currentTime
        current_duration = new_current_time
        updateDuration()
    }, 1000);

    document.getElementById('current-music').addEventListener('ended', e => {
        if (!on_loop) {
            playNext()
        }
        else {
            current_duration = 0;
            continueSong()
        }
    })
}

function pauseSong() {
    console.log(timeline_interval)
    clearInterval(timeline_interval)
    document.getElementById('current-music').pause()
}

function updateVolume() {
    if (current_song != undefined) {
        document.getElementById('current-music').volume = parseInt(current_volume) / 100
    }
}

function loadSong(from_gui = true) {

    document.querySelector('.right').innerHTML = ""
    if (from_gui) {
        hovered_song_id = current_song_element.closest('.song-item').querySelector('.song-number').textContent
        hovered_song_name = current_song_element.closest('.song-item').querySelector('.song-title-heading').textContent
        hovered_artist_name = current_song_element.closest('.song-item').querySelector('.song-title-artist').textContent


        for (song of songs) {
            if (song['title'] === hovered_song_name) {
                current_song = song
                break
            }
        }

        for (artist of artists) {
            for (sub_artist of hovered_artist_name.split(',')) {
                if (sub_artist === artist['name']) {
                    current_artist = artist
                    break;
                }
            }
        }

    }

    let list_title = current_list

    let right_panel_content = `<span class="heading current-list-name">${list_title}</span>

            <div class="current-song-data">
                <span class="current-song-thumb">
                    <img src="files/images/song-thumbs/song-thumb-${current_song['id']}.jpg" alt="">
                </span>
                <div class="current-song-desc">
                    <div class="current-song-info"><span class="current-song-title">${current_song['title']}</span>
                        <span class="current-song-artist">${current_song['artist']}</span>
                    </div>
                </div>
                <div class="current-artist-panel">
                    <span class="current-artist-thumb">
                        <img src="files/images/artist-thumbs/artist-thumb-${current_artist['id']}.jpg" alt="">
                        <span class="about-artist-header">About the artist</span>
                    </span>
                    <span class="current-artist-name">${current_artist['name']}</span>
                    <span class="current-artist-listeners">${current_artist['monthlyListeners']} monthly listeners</span>
                    <span class="about-artist">${current_artist['description']}</span>
                </div>
            </div>`

    document.querySelector('.right').insertAdjacentHTML('beforeend', right_panel_content)

    let small_panel_content = `<div class="small-song-panel">
                        <span class="small-song-thumb"><img src="files/images/song-thumbs/song-thumb-${current_song['id']}.jpg" alt=""></span>
                        <div class="small-song-info">
                            <span class="small-song-title">${current_song['title']}</span>
                            <span class="small-song-artist">${current_song['artist']}</span>
                        </div>
                    </div>`

    document.querySelector('footer').firstElementChild.remove();
    document.querySelector('footer').insertAdjacentHTML('afterbegin', small_panel_content)

    document.getElementById('timeline-slider').disabled = false
    document.getElementById('total-time-duration').textContent = current_song['duration']

    total_duration = (parseInt(current_song['duration'].slice(0, current_song['duration'].search(':'))) * 60) + parseInt(current_song['duration'].slice(current_song['duration'].search(":") + 1, current_song['duration'].length))

    current_duration = 0;
    updateDuration()
    if (is_song_played) {
        continueSong()
    }
}

function playNext() {
    if (current_song == undefined) {
        return
    }


    pauseSong()
    console.log(current_songs)
    let current_index = current_songs.indexOf(current_song)
    let new_index = current_index + 1
    if (new_index >= current_songs.length) {
        new_index = 0
    }

    current_duration = 0;
    current_song = current_songs[new_index]
    let current_artist_names = current_song['artist'].split(',')
    let current_artist_name = current_artist_names[current_artist_names.length - 1]
    current_artist = artists.find(artist => artist['name'] === current_artist_name)
    current_song_element = document.getElementById(`song-${new_index}`)

    let old_id = hovered_song_id
    hovered_song_id = new_index + 1

    if (document.getElementById('browse-window').hidden === true) {
        if (document.getElementById(`song-${old_id}`)) {
            document.getElementById(`song-${old_id}`).closest('.song-item').style.background = "none"
            document.getElementById(`song-${old_id}`).querySelector('.song-title-heading').style.color = "var(--primary-font-color)"
        }
        document.getElementById(`song-${hovered_song_id}`).closest('.song-item').style.backgroundColor = "#313131"
        document.getElementById(`song-${hovered_song_id}`).closest('.song-item').querySelector('.song-title-heading').style.color = "#08c240"
    }

    loadSong(false)
}


function loadSongContent(target_element, type, library = false) {

    let curr_key_name
    let curr_key
    let thumb_src

    if (library) {
        curr_key_name = target_element.closest(`.library-card`).querySelector('.library-card-title').textContent
        thumb_src = target_element.closest('.library-card').querySelector('.library-card-icon img').src
    }
    else {
        if (type === "genre") {
            curr_key_name = target_element.closest(`.real-${type}-item`).querySelector(`.${type}-item-name`).textContent
            curr_key = genres.find(item => item['name'] === curr_key_name)
        }
        else if (type === "artist") {
            curr_key_name = target_element.closest(`.real-${type}-item`).querySelector(`.${type}-name`).textContent
            curr_key = artists.find(item => item['name'] === curr_key_name)
        }

        thumb_src = `files/images/${type}-thumbs/${type}-thumb-${curr_key['id']}.jpg`
    }

    let songs_count = 0

    for (let song of songs) {
        if ((song[`${type}`]).includes(curr_key_name)) {
            current_songs.push(song)
            songs_count++
        }
    }


    let songs_window_element = `<div id="songs-window">
                <div class="songs-title-box">
                    <span class="songs-title-image"><img src="${thumb_src}"
                            alt=""></span>

                    <div class="songs-title-text">
                        <span class="songs-title-caption">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        <span class="songs-title-name big-heading heading title">${curr_key_name}</span>
                        <span class="songs-count">${songs_count} ${(songs_count > 1) ? "songs" : "song"}</span>
                    </div>
                </div>

                <div class="songs-content">
                    <div class="songs-header songs-general-grid">
                        <span>#</span>
                        <span>Title</span>
                        <span>Genre</span>
                        <span>Duration</span>
                    </div>

                    <div class="songs-items"></div>
                </div>
            </div>`


    document.getElementById('middle-sec').insertAdjacentHTML('beforeend', songs_window_element)

    let count = 1
    for (song of current_songs) {
        document.getElementById('songs-window').querySelector('.songs-items').insertAdjacentHTML('beforeend', `<span class="song-item songs-general-grid" id="song-${count}">
                            <span class="song-number">${count}</span>

                            <div class="song-title">
                                <span class="song-thumb"><img src="files/images/song-thumbs/song-thumb-${song['id']}.jpg" alt=""></span>
                                <div class="song-title-text">
                                    <span class="song-title-heading">${song['title']}</span>
                                    <span class="song-title-artist">${song['artist']}</span>
                                </div>
                            </div>

                            <div class="song-genre">
                                ${song['genre']}
                            </div>

                            <div class="song-duration">
                                ${song['duration']}
                            </div>
                        </span>`)

        count++
    }

    document.querySelectorAll('.song-item').forEach((item) => {
        item.addEventListener('click', (e) => {
            current_song_element = e.target

            if (document.getElementById('browse-window').hidden === true) {
                if (hovered_song_id != -1) {
                    if (document.getElementById(`song-${hovered_song_id}`)) {
                        document.getElementById(`song-${hovered_song_id}`).closest('.song-item').style.background = "none"
                        document.getElementById(`song-${hovered_song_id}`).querySelector('.song-title-heading').style.color = "var(--primary-font-color)"
                    }
                }

                current_song_element.closest('.song-item').style.backgroundColor = "#313131"
                current_song_element.closest('.song-item').querySelector('.song-title-heading').style.color = "#08c240"
            }

            loadSong()
        })
    })
}

function loadLibraries() {
    let count = 1
    for (library of libraries) {
        let lib_thumb
        let lib_type = library['type']
        let lib_name = library['name']

        if (lib_type === 'playlist') {
            lib_thumb = `files/images/img-liked-songs.png`
        }
        else if (lib_type === 'genre') {
            for (genre of genres) {
                if (genre['name'] === lib_name) {
                    lib_thumb = `files/images/genre-thumbs/genre-thumb-${genre['id']}.jpg`
                }
            }
        }
        else if (lib_type === 'artist') {
            for (artist of artists) {
                if (artist['name'] === lib_name) {
                    lib_thumb = `files/images/artist-thumbs/artist-thumb-${artist['id']}.jpg`
                }
            }
        }

        let lib_item = `<div class="library-card" id="lib-${count}">
                    <span class="library-card-icon">
                        <img src="${lib_thumb}" alt="">
                    </span>
                    <div class="library-card-desc">
                        <span class="library-card-title">${lib_name}</span>
                        <span class="library-card-caption">${lib_type.charAt(0).toUpperCase() + lib_type.slice(1)}</span>
                    </div>
                </div>`

        document.querySelector(".libraries").insertAdjacentHTML('beforeend', lib_item)
        count++
    }
}

document.querySelector('.search-icon').addEventListener('click', () => {
    document.querySelector('.search-text').focus()
})

async function loadOverlay() 
{
    console.log("waiting...")
    await wait(3000)
    console.log("waited...")
    document.querySelector('.overlay-content').style.bottom = "100px"
    
    if (localStorage.getItem('spotify-name') !== null)
    {
        document.querySelector('.overlay').insertAdjacentHTML('beforeend',`<span class="welcome-text" style="position: relative; bottom: 80px; text-align: center">
            <span style="font-size: 50px;">Welcome </span>
            <span style="color: #08c240; font-size: 50px;">${localStorage.getItem('spotify-name')}</span>
            <span style="font-size: 50px;">!</span>
        </span>`)

        await wait(1000)
        document.querySelector('.overlay').classList.add('.fade-overlay')
        await wait(2000)
        document.querySelector('.overlay').remove()
    }
    else
    {
        document.querySelector('.overlay').insertAdjacentHTML('beforeend',`<div class="input-box">
            <input type="text" class="user-name" id="user-name" placeholder="Enter your name">
            <button class="start-spotify-button" id="start-spotify-button">Start</button>
        </div>`)

        document.getElementById('user-name').addEventListener('input',e=>{
            document.getElementById('user-name').classList.remove('error-text')
        })
        

        document.getElementById('start-spotify-button').addEventListener('click',e=>{
            let input_box = document.getElementById('user-name')
            if (input_box.value === "")
            {
                input_box.classList.add('error-text')
                return;
            }
            
            localStorage.setItem('spotify-name', input_box.value)

            document.querySelector('nav .rightbar span').innerHTML = "Welcome " + `<span style="color: #08c240">${localStorage.getItem('spotify-name')}!</span>`
            document.querySelector('.overlay').remove()
            
        })
    }    
}

async function main() {
    loadOverlay()

    console.log(localStorage.getItem('spotify-name'))
    document.querySelector('nav .rightbar span').innerHTML = "Welcome " + `<span style="color: #08c240">${localStorage.getItem('spotify-name')}!</span>`
    for (i = 0; i < 5; i++) {
        document.querySelector('.genre-items').insertAdjacentHTML("beforeend", `<div class="genre-item">
                        <div class="genre-item-thumb">
                            <div class="genre-raw-item"></div>
                        </div>
                    </div>`)

        document.querySelector('.artist-items').insertAdjacentHTML("beforeend", `<div class="artist-item">
                        <div class="artist-box"></div>
                        <div class="artist-name-box"></div>
                        <div class="artist-caption-box"></div>
                    </div>`)
    }

    console.log("Loading...")
    await loadData()
    console.log("Loaded Data...")

    document.querySelectorAll('.genre-item').forEach((e) => {
        e.remove();
    })

    document.querySelectorAll('.artist-item').forEach((e) => {
        e.remove();
    })

    for (genre of genres) {
        let genre_id = genre['id']
        let genre_name = genre['name']
        let genre_box_color = genre['color']

        let genre_item = `<div class="genre-item real-genre-item">
                                <div class="genre-item-thumb">
                                    <div class="genre-item-box" style="background-color: ${genre_box_color};"></div>
                                    <img src="files/images/genre-thumbs/genre-thumb-${genre_id}.jpg" alt="">
                                    <div class="genre-item-name">${genre_name}</div>
                                </div>
                            </div>`



        document.querySelector('.genre-items').insertAdjacentHTML("beforeend", genre_item)
    }

    for (artist of artists) {
        let artist_id = artist['id']
        let artist_name = artist['name']

        let artist_item = `<div class="artist-item real-artist-item">
                                <div class="artist-image"><img src="files/images/artist-thumbs/artist-thumb-${artist_id}.jpg" alt=""></div>
                                <span class="artist-name">${artist_name}</span>
                                <span class="artist-caption">Artist</span>
                            </div>`

        document.querySelector('.artist-items').insertAdjacentHTML("beforeend", artist_item)
    }

    document.querySelectorAll(".real-genre-item").forEach((genre_item) => {
        genre_item.addEventListener('click', (e) => {
            current_list = e.target.closest('.real-genre-item').querySelector('.genre-item-name').textContent
            document.getElementById('browse-window').hidden = true
            current_songs = []
            loadSongContent(e.target, 'genre')
        })
    })

    document.querySelectorAll(".real-artist-item").forEach((genre_item) => {
        genre_item.addEventListener('click', (e) => {
            current_list = e.target.closest('.real-artist-item').querySelector('.artist-name').textContent
            document.getElementById('browse-window').hidden = true
            current_songs = []
            loadSongContent(e.target, 'artist')
        })
    })

    document.querySelector(".home-btn").addEventListener('click', (e) => {
        document.getElementById('songs-window').remove()
        document.getElementById('browse-window').hidden = false
        if (selected_lib != -1) {
            document.getElementById(`lib-${selected_lib}`).style.background = "None"
            document.getElementById(`lib-${selected_lib}`).querySelector('.library-card-title').style.color = "var(--primary-font-color)"
        }
    })

    document.getElementById('volume-slider').addEventListener('input', (e) => {
        volume_slider = document.getElementById('volume-slider')

        if (volume_slider.value == 0) {
            document.getElementById('img-volume-icon').src = `files/icons/mute-icon.svg`
            is_muted = true;
        }
        else {
            document.getElementById('img-volume-icon').src = `files/icons/volume-icon.svg`
            is_muted = false;
        }

        current_volume = volume_slider.value
        updateVolume()

        volume_slider.style.background = `linear-gradient(90deg, #08c240 ${volume_slider.value}%, white ${volume_slider.value}%)`
    })

    document.getElementById('timeline-slider').addEventListener('input', (e) => {
        timeline_slider = document.getElementById('timeline-slider')

        current_duration = (parseInt(timeline_slider.value) / 100) * total_duration

        updateDuration()

        if (is_song_played) {
            continueSong()
        }
    })

    document.querySelector('.volume-icon').addEventListener('click', (e) => {
        if (is_muted) {
            document.getElementById('img-volume-icon').src = `files/icons/volume-icon.svg`
            volume_slider = document.getElementById('volume-slider')
            volume_slider.value = 5
            volume_slider.style.background = `linear-gradient(90deg, #08c240 ${5}%, white ${5}%)`
        }
        else {
            document.getElementById('img-volume-icon').src = `files/icons/mute-icon.svg`
            volume_slider = document.getElementById('volume-slider')
            volume_slider.value = 0
            volume_slider.style.background = `linear-gradient(90deg, #08c240 ${0}%, white ${0}%)`
        }

        current_volume = volume_slider.value
        updateVolume()
        is_muted = !is_muted
    })

    document.getElementById('main-play-btn').addEventListener('click', (e) => {
        if (current_song == undefined) {
            return
        }

        if (is_song_played) {
            document.getElementById('main-play-btn').querySelector("#img-play-icon").src = `files/icons/play-icon.svg`
            pauseSong()
        }
        else {
            document.getElementById('main-play-btn').querySelector("#img-play-icon").src = `files/icons/pause-icon.svg`
            continueSong()
        }

        is_song_played = !is_song_played
    })

    document.getElementById('repeat-btn').addEventListener('click', e => {
        if (on_loop) {
            document.getElementById('repeat-btn').querySelector('img').style.filter = "invert()"
            document.getElementById('repeat-btn').querySelector('img').src = `files/icons/repeat-icon.svg`
        }
        else {
            document.getElementById('repeat-btn').querySelector('img').style.filter = "none"
            document.getElementById('repeat-btn').querySelector('img').src = `files/icons/repeated-icon.svg`
        }

        on_loop = !on_loop
    })


    document.getElementById('next-btn').addEventListener('click', () => {
        playNext()
    })

    document.getElementById('prev-btn').addEventListener('click', () => {
        if (current_song == undefined) {
            return
        }

        pauseSong()
        let current_index = current_songs.indexOf(current_song)
        let new_index = current_index - 1
        if (new_index <= -1 || new_index >= current_songs.length) {
            new_index = current_songs.length - 1
        }

        console.log(new_index)
        console.log(current_songs)
        current_duration = 0;
        current_song = current_songs[new_index]

        console.log(current_song)

        let current_artist_names = current_song['artist'].split(',')
        let current_artist_name = current_artist_names[current_artist_names.length - 1]
        current_artist = artists.find(artist => artist['name'] === current_artist_name)
        current_song_element = document.getElementById(`song-${new_index}`)


        let old_id = hovered_song_id
        hovered_song_id = new_index + 1

        if (document.getElementById('browse-window').hidden === true) {
            if (document.getElementById(`song-${old_id}`)) {
                document.getElementById(`song-${old_id}`).closest('.song-item').style.background = "none"
                document.getElementById(`song-${old_id}`).querySelector('.song-title-heading').style.color = "var(--primary-font-color)"
            }
            document.getElementById(`song-${hovered_song_id}`).closest('.song-item').style.backgroundColor = "#313131"
            document.getElementById(`song-${hovered_song_id}`).closest('.song-item').querySelector('.song-title-heading').style.color = "#08c240"
        }

        loadSong(false)
    })

    loadLibraries()

    document.querySelectorAll('.library-card').forEach(lib => {
        lib.addEventListener('click', e => {
            document.getElementById('browse-window').hidden = true

            if (document.getElementById('songs-window')) {
                current_songs = []
                document.getElementById('songs-window').remove()
            }

            if (selected_lib != -1) {
                document.getElementById(`lib-${selected_lib}`).style.background = "None"
                document.getElementById(`lib-${selected_lib}`).querySelector('.library-card-title').style.color = "var(--primary-font-color)"

            }

            let curr_lib = e.target.closest('.library-card')
            selected_lib = curr_lib.id.slice(curr_lib.id.search('-') + 1, curr_lib.length)
            curr_lib.style.backgroundColor = "#313131"
            curr_lib.querySelector('.library-card-title').style.color = "#08c240"
            console.log(selected_lib)
            loadSongContent(curr_lib, `${curr_lib.querySelector('.library-card-caption').textContent.toLowerCase()}`, true)
        })
    })
}
main()
