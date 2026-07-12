# AssetFlow Odoo Windows Deployment Guide

This guide is tailored for this repository and the AssetFlow Odoo addon scaffold located at C:\odoo\addons\assetflow_management.

## 1. Install required software on Windows

### 1.1 Install PostgreSQL
1. Download PostgreSQL for Windows from the official PostgreSQL website.
2. Install PostgreSQL and remember the password for the `postgres` superuser.
3. Keep the default port `5432`.
4. Start the PostgreSQL service:
   - Press `Win + R`
   - Type `services.msc`
   - Find the PostgreSQL service and ensure it is running

### 1.2 Install Git
1. Download and install Git for Windows from https://git-scm.com/
2. Verify installation:
   ```bat
   git --version
   ```

### 1.3 Install Python 3.12
1. Download Python 3.12.x for Windows.
2. During install, select:
   - `Add Python to PATH`
   - `pip`
3. Verify:
   ```bat
   python --version
   py -3.12 --version
   ```

### 1.4 Install Odoo Community Edition
1. Download Odoo Community Edition from the official Odoo website.
2. Extract it to a folder such as:
   ```text
   C:\odoo-src
   ```
3. Recommended layout:
   ```text
   C:\odoo-src\odoo
   C:\odoo-src\addons
   C:\odoo-src\custom-addons
   ```

## 2. Create Python virtual environment

Open Command Prompt and run:

```bat
cd C:\odoo-src
python -m venv venv
venv\Scripts\activate
```

Verify the environment is active:

```bat
where python
python --version
```

## 3. Install Python dependencies

Inside the virtual environment, install the required packages. For Odoo Community Edition, a common minimal set is:

```bat
pip install --upgrade pip setuptools wheel
pip install psycopg2-binary
```

If you are using a newer Odoo version, you may also need additional dependencies such as:

```bat
pip install Babel decorator docutils ebaysdk feedparser gevent greenlet html2text Jinja2 lxml Mako MarkupSafe num2words ofxparse passlib Pillow psutil pydot pyOpenSSL pyserial python-dateutil python-ldap python-stdnum pytz pyusb qrcode reportlab requests six suds-jurko vatnumber vobject Werkzeug XlsxWriter xlwt xlrd
```

## 4. Configure PostgreSQL

### 4.1 Create database and user
Open `psql` or use pgAdmin and run:

```sql
CREATE DATABASE odoo_db;
CREATE USER odoo_user WITH PASSWORD 'odoo_password';
ALTER ROLE odoo_user WITH SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE odoo_db TO odoo_user;
```

## 5. Configure Odoo

Create a file named `odoo.conf` in `C:\odoo-src` with the following content:

```ini
[options]
addons_path = C:\odoo-src\odoo\addons,C:\odoo-src\addons,C:\odoo-src\custom-addons,C:\odoo\addons
admin_passwd = admin
csv_internal_sep = ,
db_host = localhost
db_port = 5432
db_user = odoo_user
db_password = odoo_password
db_name = odoo_db
logfile = C:\odoo-src\odoo.log
xmlrpc_port = 8069
```

### 5.1 Important addon path
The AssetFlow addon scaffold is located at:

```text
C:\odoo\addons\assetflow_management
```

That path is included above as:

```text
C:\odoo\addons
```

So Odoo can discover the module as:

```text
assetflow_management
```

## 6. Verify the AssetFlow addon structure

The module should exist at:

```text
C:\odoo\addons\assetflow_management
```

Verify these files are present:

```text
C:\odoo\addons\assetflow_management\__init__.py
C:\odoo\addons\assetflow_management\__manifest__.py
C:\odoo\addons\assetflow_management\models\__init__.py
C:\odoo\addons\assetflow_management\models\asset.py
C:\odoo\addons\assetflow_management\models\asset_category.py
C:\odoo\addons\assetflow_management\models\asset_allocation.py
C:\odoo\addons\assetflow_management\views\asset_views.xml
C:\odoo\addons\assetflow_management\views\allocation_views.xml
C:\odoo\addons\assetflow_management\views\menu_views.xml
C:\odoo\addons\assetflow_management\security\ir.model.access.csv
C:\odoo\addons\assetflow_management\data\asset_data.xml
```

### 6.1 Check the manifest
The module manifest should contain:

```python
{
    'name': 'AssetFlow Management',
    'version': '1.0.0',
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'views/asset_views.xml',
        'views/allocation_views.xml',
        'views/menu_views.xml',
        'data/asset_data.xml',
    ],
    'installable': True,
    'application': True,
}
```

### 6.2 Check the initialization files
Ensure these files exist and import the models:

- [C:\odoo\addons\assetflow_management\__init__.py](addons/assetflow_management/__init__.py)
- [C:\odoo\addons\assetflow_management\models\__init__.py](addons/assetflow_management/models/__init__.py)

## 7. Run Odoo locally

### 7.1 Start PostgreSQL
Make sure the PostgreSQL service is running.

### 7.2 Start Odoo server
Open Command Prompt and run:

```bat
cd C:\odoo-src
venv\Scripts\activate
python odoo\odoo-bin -c odoo.conf
```

If Odoo is installed in a different folder, change the path accordingly.

### 7.3 Access Odoo
Open a browser and visit:

```text
http://localhost:8069
```

## 8. Install the AssetFlow module

### 8.1 Enable developer mode
1. Log in to Odoo
2. Open the user menu
3. Activate Developer Mode

### 8.2 Update Apps list
1. Go to Apps
2. Click `Update Apps List`
3. Wait for the app list to refresh

### 8.3 Install the module
1. Search for `assetflow_management`
2. Click `Install`

### 8.4 Verify the result
After installation, check that:
- the module appears as installed
- the AssetFlow menu is visible
- the asset and allocation views load

## 9. Troubleshooting

### 9.1 PostgreSQL connection errors
Symptoms:
- `could not connect to server`
- `password authentication failed`

Fix:
- Confirm PostgreSQL is running
- Confirm `db_host`, `db_port`, `db_user`, and `db_password` in `odoo.conf`
- Confirm the database and role exist
- Test with:

```bat
psql -h localhost -U odoo_user -d odoo_db
```

### 9.2 Missing Python packages
Symptoms:
- `ImportError`
- `No module named ...`

Fix:
- Activate the virtual environment
- Reinstall missing packages
- Verify with:

```bat
pip list
```

### 9.3 Wrong addons path
Symptoms:
- Module not showing in Apps list
- `Module not found`

Fix:
- Ensure `C:\odoo\addons` is listed in `addons_path`
- Ensure the folder is named exactly `assetflow_management`
- Restart Odoo after editing `odoo.conf`

### 9.4 Module installation errors
Symptoms:
- XML errors
- Missing model or view issues

Fix:
- Review the Odoo server log
- Verify the manifest file is valid JSON/Python syntax
- Confirm XML files are well formed
- Confirm the access file is valid CSV

### 9.5 Port conflicts
Symptoms:
- Odoo fails to start
- `Address already in use`

Fix:
- Change the port in `odoo.conf`:
  ```ini
  xmlrpc_port = 8070
  ```
- Or stop the process using port `8069`.

## 10. Recommended next coding step for AssetFlow ERP

The next useful step is to expand the Odoo addon with the next core business objects:
- maintenance requests
- booking/resource management
- audit cycles
- department and employee records

This would move the module from the current scaffold toward a more complete ERP workflow.
