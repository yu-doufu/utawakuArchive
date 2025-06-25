document.addEventListener("DOMContentLoaded", async () => {
  const videoSelect = document.getElementById("video-select");
  const timestampSelect = document.getElementById("timestamp-select");
  const playButton = document.getElementById("play-button");
  const randomPlayButton = document.getElementById("random-play-button");
  const globalRandomButton = document.getElementById("global-random-button");
  const nonMembersRandomButton = document.getElementById("non-members-random-button");
  const songListUL = document.getElementById("songlist-list");
  const songListPlayButton = document.getElementById("songlist-play-button");

  let videos = [];
  let songs = [];
  let selectedSongIndex = null;

  // 🎥 videos.json 読み込み
  try {
    const res = await fetch("./videos.json");
    if (!res.ok) throw new Error(`videos.json error: ${res.status}`);
    videos = await res.json();
  } catch (err) {
    console.error("videos.json 読み込みエラー:", err);
  }

  // 🎥 動画選択リスト作成（※マークを追加）
  videoSelect.innerHTML = '<option value="">好きな歌枠を選択してくれ！</option>';
  videos.forEach((video, idx) => {
    const displayName = video.membershipOnly ? `※${video.videoName}` : video.videoName;
    const option = new Option(displayName, idx);
    videoSelect.add(option);
  });

  videoSelect.addEventListener("change", ({ target: { value } }) => {
    const video = videos[value];
    if (!video) return resetTimestampDropdown();
    timestampSelect.innerHTML = '<option value="">歌枠を選んだら曲も選んでくれよな！</option>';
    video.timestamps.forEach(({ title }, idx) => {
      const opt = new Option(title, idx);
      timestampSelect.add(opt);
    });
  });

  timestampSelect.addEventListener("change", ({ target: { value: idx } }) => {
    const video = videos[videoSelect.value];
    const song = video?.timestamps[idx];
    if (song) playButton.setAttribute("data-url", song.url);
  });

  playButton.addEventListener("click", () => {
    const url = playButton.getAttribute("data-url") || "https://youtube.com";
    window.open(url, "_blank");
  });

  randomPlayButton.addEventListener("click", () => {
    const video = videos[videoSelect.value];
    if (video?.timestamps?.length > 0) {
      const random = video.timestamps[Math.floor(Math.random() * video.timestamps.length)];
      window.open(random.url, "_blank");
    }
  });

  globalRandomButton.addEventListener("click", () => {
    const all = videos.flatMap(v => v.timestamps);
    if (all.length > 0) {
      const r = all[Math.floor(Math.random() * all.length)];
      window.open(r.url, "_blank");
    }
  });

  nonMembersRandomButton.addEventListener("click", () => {
    const publicSongs = videos.filter(v => !v.membershipOnly).flatMap(v => v.timestamps);
    if (publicSongs.length > 0) {
      const r = publicSongs[Math.floor(Math.random() * publicSongs.length)];
      window.open(r.url, "_blank");
    }
  });

  function resetTimestampDropdown() {
    timestampSelect.innerHTML = '<option value="">歌枠を選んだら曲も選んでくれよな！</option>';
  }

  // 🔠 文字種分類（ひらがな→カタカナ→漢字→アルファベット→その他）
  function getCharGroup(ch) {
    if (/^[ぁ-ん]/.test(ch)) return "1";
    if (/^[ァ-ヶー]/.test(ch)) return "2";
    if (/^[一-龯々]/.test(ch)) return "3";
    if (/^[a-zA-Z]/.test(ch)) return "4";
    return "5";
  }

  // 🎵 songs.json 読み込み＋ソート＋赤文字表示＋※除外ソート
  try {
    const res = await fetch("./songs.json");
    if (!res.ok) throw new Error(`songs.json error: ${res.status}`);
    const rawSongs = await res.json();

    songs = rawSongs.map(({ label, url, furigana }) => {
      const [titleRaw, rest] = label.split(" / ");
      const title = titleRaw.replace(/^※/, "");
      const firstChar = title.charAt(0);
      const group = getCharGroup(firstChar);
      const highlight = `<span style="color: red;">${titleRaw}</span> / ${rest}`;
      const base = group === "3" && typeof furigana === "string" ? furigana : title;
      const sortKey = base.normalize("NFKC")
        .replace(/[ァ-ン]/g, s => String.fromCharCode(s.charCodeAt(0) - 0x60))
        .toLowerCase()
        .replace(/[^ぁ-んa-z0-9]/g, "");
      return { label: highlight, url, sortKey, group };
    }).sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return a.sortKey.localeCompare(b.sortKey, "ja");
    });

    songs.forEach(({ label }, i) => {
      const li = document.createElement("li");
      li.innerHTML = label;
      li.dataset.index = i;
      li.style.cursor = "pointer";
      li.style.padding = "10px";
      li.style.borderRadius = "6px";
      li.style.border = "1px solid #e0c3a0";
      li.style.backgroundColor = "#fff5eb";
      li.style.marginBottom = "8px";
      li.addEventListener("click", () => {
        selectedSongIndex = i;
        [...songListUL.children].forEach(el => el.style.backgroundColor = "#fff5eb");
        li.style.backgroundColor = "#ffe0b2";
      });
      songListUL.appendChild(li);
    });
  } catch (e) {
    console.error("songs.json 読み込みエラー:", e);
  }

  songListPlayButton.addEventListener("click", () => {
    const selected = songs[selectedSongIndex];
    if (selected?.url) {
      window.open(selected.url, "_blank");
    } else {
      alert("曲を選んでから再生してくれよな！");
    }
  });
});
