for f in *torrent
do
  echo "Processing $f"
  mv "$f" "/start/location/$f"
  mv "$f" "$f.done"
done
