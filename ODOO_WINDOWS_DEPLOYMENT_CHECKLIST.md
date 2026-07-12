# AssetFlow Odoo Windows Deployment Checklist

This checklist is for installing and running Odoo Community Edition on Windows and installing the AssetFlow addon module from this repository.

## 1. Required software installation

### 1.1 PostgreSQL
- Download PostgreSQL for Windows from the official PostgreSQL website.
- Install PostgreSQL and keep the default port `5432`.
- During installation, set a password for the `postgres` user.
- After installation, start the PostgreSQL service from Services:
  - Press `Win + R`
  - Type `services.msc`
  - Find `postgresql` and ensure it is running

### 1.2 Git
- Install Git for Windows from https://git-scm.com/
- Verify installation:
  - Open Command Prompt
  - Run: `git --version`

### 1.3 Python
- Install Python 3.12.x for Windows.
- During installation, check:
  - `Add Python to PATH`
  - `pip`
- Verify:
  - `python --version`
  - `pip --version`

### 1.4 Odoo Community Edition
- Download Odoo Community Edition from the official Odoo website.
- Extract it to a folder such as:
  - `C:\odoo-src`
- Recommended structure:
  - `C:\odoo-src\odoo`
  - `C:\odoo-src\addons`
  - `C:\odoo-src\custom-addons`

## 2. Environment configuration

### 2.1 Create a Python virtual environment
Open Command Prompt and run:

```bat
cd C:\odoo-src
python -m venv venv
venv\Scripts\activate
```

### 2.2 Install Python dependencies
Inside the virtual environment, install the required packages:

```bat
pip install --upgrade pip setuptools wheel
pip install psycopg2-binary Babel decorator docutils ebaysdk feedparser gevent greenlet html2text Jinja2 lxml Mako MarkupSafe num2words ofxparse passlib Pillow psutil psycopg2-binary pydot pyOpenSSL pyserial python-dateutil python-ldap python-stdnum pytz pyusb qrcode reportlab requests six suds-jurko vatnumber vobject Werkzeug XlsxWriter xlwt xlrd
```

If you want the minimal working base, the most important package for PostgreSQL support is:

```bat
pip install psycopg2-binary
```

### 2.3 Create PostgreSQL database
Open PostgreSQL shell or use pgAdmin:

```sql
CREATE DATABASE odoo_db;
CREATE USER odoo_user WITH PASSWORD 'odoo_password';
ALTER ROLE odoo_user WITH SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE odoo_db TO odoo_user;
```

### 2.4 Create Odoo configuration file
Create a file named `odoo.conf` in `C:\odoo-src` with content like:

```ini
[options]
; Path to Odoo server
addons_path = C:\odoo-src\odoo\addons,C:\odoo-src\addons,C:\odoo-src\custom-addons
admin_passwd = admin
db_host = localhost
db_port = 5432
db_user = odoo_user
db_password = odoo_password
db_name = odoo_db
logfile = C:\odoo-src\odoo.log
xmlrpc_port = 8069
```

### 2.5 Add your custom addon path
Place the AssetFlow addon folder in one of the addon paths, for example:

```text
C:\odoo-src\custom-addons\assetflow_management
```

If you want to use the repository folder directly, place it here:

```text
C:\odoo-src\custom-addons\assetflow_management
```

## 3. Running Odoo locally

### 3.1 Start PostgreSQL service
If not already running:
- Open Services
- Start the PostgreSQL service

### 3.2 Start Odoo server
From the virtual environment, run:

```bat
cd C:\odoo-src
venv\Scripts\activate
python odoo\odoo-bin -c odoo.conf
```

### 3.3 Access Odoo in the browser
Open:

```text
http://localhost:8069
```

Create the database from the web interface.

## 4. Installing the AssetFlow module

### 4.1 Enable developer mode
- Log in to Odoo
- Open the user menu
- Select "Activate the developer mode"

### 4.2 Update Apps list
- Go to Apps
- Click "Update Apps List"
- Wait for the module list to refresh

### 4.3 Install the module
- Search for `assetflow_management`
- Click Install

## 5. Troubleshooting

### 5.1 PostgreSQL connection errors
Symptoms:
- `could not connect to server`
- `password authentication failed`

Fix:
- Confirm PostgreSQL service is running
- Confirm `db_host`, `db_port`, `db_user`, and `db_password` in `odoo.conf`
- Verify the database and user exist
- Test connection with:

```bat
psql -h localhost -U odoo_user -d odoo_db
```

### 5.2 Missing Python packages
Symptoms:
- ImportError during startup
- Module not found

Fix:
- Activate the virtual environment
- Reinstall missing packages with `pip install`
- Verify with:

```bat
pip list
```

### 5.3 Addons path issues
Symptoms:
- Module not visible in Apps list
- `module not found`

Fix:
- Ensure the addon folder exists in one of the paths listed in `addons_path`
- Make sure the folder name matches the module name:
  - `assetflow_management`
- Restart Odoo after changing `odoo.conf`

### 5.4 Module loading errors
Symptoms:
- Module shows errors during install
- XML or Python parsing errors

Fix:
- Check the Odoo server log for stack traces
- Confirm the module contains:
  - `__init__.py`
  - `__manifest__.py`
- Validate XML files and CSV access files
- Ensure the model names match the XML references

## 6. Recommended folder layout

```text
C:\odoo-src
├── odoo
├── addons
├── custom-addons
│   └── assetflow_management
│       ├── __init__.py
│       ├── __manifest__.py
│       ├── models
│       ├── views
│       ├── security
│       └── data
└── odoo.conf
```

## 7. Quick start summary

```bat
cd C:\odoo-src
venv\Scripts\activate
python odoo\odoo-bin -c odoo.conf
```

Then open:

```text
http://localhost:8069
```
