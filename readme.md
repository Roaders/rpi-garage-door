# RPI Garage Door

## Install

### Clone from github and build
(this can take a while on a raspberry pi)

```
git clone https://github.com/Roaders/rpi-garage-door.git
cd rpi-garage-door
npm install
npm run build
```

### Install Latest Release from GitHub

```bash
mkdir rpi-garage-door
cd rpi-garage-door
wget -O /tmp/z.$$ https://github.com/Roaders/rpi-garage-door/releases/download/[LATEST_VERSION]/garage-door-opener-[LATEST_VERSION].tgz
tar -zxvf /tmp/z.$$ --strip-components=1
rm /tmp/z.$$
npm rebuild
```

Or do the above steps with one script:

```bash
mkdir rpi-garage-door
cd rpi-garage-door
bash <(curl -sL https://raw.githubusercontent.com/Roaders/rpi-garage-door/master/update-release.sh)
```

this script:

 * Finds the latest release tar using the GitHub API
 * downloads it to a temporary folder and checks it is a valid archive
 * stops the `garage-door` service
 * extracts the tar
 * rebuilds epoll (tar is compiled on 64 bit machine, most pis are 32 bit)
 * cleans up downloaded files
 * starts `garage-door` service (this also happens if extracting or rebuilding fails)

If the release can't be found or the download fails, the script exits before stopping the service.

### Create Users

```
npm run create-user
```

### Verify User

```
npm run check-user
```

### Generate Secret for Jwt

```
npm run generate-secret
```

### Run server (not as a service)

```
npm run start-prod
```

## Running as a service

### Get Status

```bash
sudo systemctl status garage-door
```

### Start and stop

```bash
sudo systemctl stop garage-door
```
```bash
sudo systemctl start garage-door
```

### Logs

```bash
journalctl -u garage-door
```

### Setup

Create `/etc/systemd/system/garage-door.service`:

```
[Service]
WorkingDirectory=/home/pi/git/rpi-garage-door
ExecStart=npm run start-prod
Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=garage-door
User=pi
Group=pi
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

and enable the service:

```bash
sudo systemctl enable garage-door.service
```

## Secure Certificate

Install certbot:

```bash
sudo apt-get install certbot
```

create certificate:

```bash
sudo certbot certonly --standalone
```
(port 80 needs to be forwarded to your pi)
follow instructions

If it works we get the following message:

```
IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/MYDOMAIN/fullchain.pem
   Your key file has been saved at:
   /etc/letsencrypt/live/MYDOMAIN/privkey.pem
   Your cert will expire on 2020-10-10. To obtain a new or tweaked
   version of this certificate in the future, simply run certbot
   again. To non-interactively renew *all* of your certificates, run
   "certbot renew"
```

copy `/etc/letsencrypt/live/MYDOMAIN/fullchain.pem` and `/etc/letsencrypt/live/MYDOMAIN/privkey.pem` into `.env` file in root of web server:

```
keyPath=/etc/letsencrypt/live/MYDOMAIN/privkey.pem
certificatePath=/etc/letsencrypt/live/MYDOMAIN/fullchain.pem
```

make cert files readable:

```bash
sudo chmod -R a+r /etc/letsencrypt/archive/MY_DOMAIN
```

edit deploy hook:

```bash
sudo nano /etc/letsencrypt/renewal/MY_DOMAIN.conf
```
and add the restart command:
```
# Options used in the renewal process
[renewalparams]
account = PRE_POPULATED
authenticator = PRE_POPULATED
server = PRE_POPULATED
renew_hook = systemctl restart garage-door
```

### Renew Certificates:

(this should happen automatically)

```bash
sudo certbot renew
```

dry run

```bash
sudo certbot renew --dry-run
```

force (to test server restart)

```bash
 sudo certbot renew --force-renewal
```
this will only work a limited number of times a day due to rate limiting. Use dry run first.


## Stuff I learnt

This app covers quite a bit of ground and in building it I had to learn a lot of stuff:

 * Controlling hardware with RPI gpio pins and sensing state (with reed switches) and using rpi camera
 * How to issue and renew secure certificates and apply them to a dynamic IP address
 * How to securely store user passwords with bcrypt
 * How to work with access tokens and renew them with refresh tokens
 * How to secure nest endpoints with authguards
 * jwt (json web tokens) for signing access and refresh tokens
 * securing angular routes with auth guards
 * setting up push messags with Socket IO and consuming from node and angular apps
 * how to setup and run an app as a linux service
 * how to write linux bash scripts
