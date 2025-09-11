apt update && apt install lsof
lsof -i :7861
lsof -i :7860

cd workshop/ComfyUI
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.10 python3.10-venv python3.10-dev

curl -sS https://bootstrap.pypa.io/get-pip.py | python3.10

python3.10 -m pip install --upgrade pip
python3.10 -m pip install tqdm pyyaml

python3.10 -m pip install -r requirements.txt

python3.10 main.py --listen 0.0.0.0 --port 7861

