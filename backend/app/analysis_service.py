import os
import hashlib


# ==========================================
# CALCULATE SHA-256 HASH
# ==========================================

def calculate_sha256(file_path):

    sha256 = hashlib.sha256()

    with open(
        file_path,
        "rb"
    ) as file:

        while True:

            data = file.read(4096)

            if not data:
                break

            sha256.update(data)

    return sha256.hexdigest()


# ==========================================
# SUSPICIOUS EXTENSIONS
# ==========================================

SUSPICIOUS_EXTENSIONS = [

    ".exe",
    ".bat",
    ".cmd",
    ".com",
    ".scr",
    ".msi",
    ".vbs",
    ".js",
    ".jar",
    ".ps1",
    ".sh"

]


# ==========================================
# DOCUMENT EXTENSIONS
# ==========================================

DOCUMENT_EXTENSIONS = [

    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt"

]


# ==========================================
# IMAGE EXTENSIONS
# ==========================================

IMAGE_EXTENSIONS = [

    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp"

]


# ==========================================
# DOUBLE EXTENSION DETECTION
# ==========================================

def detect_double_extension(file_name):

    parts = file_name.lower().split(".")

    # Example:
    # report.pdf.exe
    # file.docx.bat

    if len(parts) < 3:
        return False

    last_extension = "." + parts[-1]

    previous_extension = "." + parts[-2]

    if (
        last_extension in SUSPICIOUS_EXTENSIONS
        and
        previous_extension in (
            DOCUMENT_EXTENSIONS
            +
            IMAGE_EXTENSIONS
        )
    ):

        return True

    return False


# ==========================================
# FILE TYPE CATEGORY
# ==========================================

def get_file_category(file_name):

    _, extension = os.path.splitext(
        file_name.lower()
    )

    if extension in SUSPICIOUS_EXTENSIONS:

        return "Executable / Script"

    elif extension in DOCUMENT_EXTENSIONS:

        return "Document"

    elif extension in IMAGE_EXTENSIONS:

        return "Image"

    elif extension:

        return "Unknown"

    return "Unknown"


# ==========================================
# MAIN FORENSIC ANALYSIS
# ==========================================

def analyze_file(

    file_path,
    original_hash,
    file_name,
    file_type=None,
    file_size=None

):

    suspicious_indicators = []

    # --------------------------------------
    # CHECK FILE EXISTS
    # --------------------------------------

    if not os.path.exists(file_path):

        return {

            "analysis_status":
                "Failed",

            "integrity_status":
                "Unknown",

            "risk_level":
                "High",

            "suspicious_indicators": [

                "Evidence file could not be found on the server."

            ],

            "message":
                "Analysis failed because the evidence file does not exist."

        }


    # --------------------------------------
    # CURRENT SHA-256
    # --------------------------------------

    current_hash = calculate_sha256(
        file_path
    )


    # --------------------------------------
    # INTEGRITY CHECK
    # --------------------------------------

    if current_hash == original_hash:

        integrity_status = "Verified"

    else:

        integrity_status = "Tampered"

        suspicious_indicators.append(

            "SHA-256 hash mismatch detected. "
            "The evidence file may have been modified."

        )


    # --------------------------------------
    # FILE EXTENSION
    # --------------------------------------

    _, extension = os.path.splitext(

        file_name.lower()

    )


    # --------------------------------------
    # SUSPICIOUS EXTENSION CHECK
    # --------------------------------------

    if extension in SUSPICIOUS_EXTENSIONS:

        suspicious_indicators.append(

            f"Suspicious executable or script extension detected: "
            f"{extension}"

        )


    # --------------------------------------
    # DOUBLE EXTENSION CHECK
    # --------------------------------------

    if detect_double_extension(file_name):

        suspicious_indicators.append(

            "Double extension detected. "
            "The file may be attempting to disguise its real type."

        )


    # --------------------------------------
    # EMPTY FILE CHECK
    # --------------------------------------

    if file_size == 0:

        suspicious_indicators.append(

            "The evidence file is empty."

        )


    # --------------------------------------
    # LARGE FILE CHECK
    # --------------------------------------

    if file_size is not None:

        if file_size > 100 * 1024 * 1024:

            suspicious_indicators.append(

                "Large file detected (greater than 100 MB)."

            )


    # --------------------------------------
    # DETERMINE RISK LEVEL
    # --------------------------------------

    if integrity_status == "Tampered":

        risk_level = "High"

    elif extension in SUSPICIOUS_EXTENSIONS:

        risk_level = "High"

    elif detect_double_extension(file_name):

        risk_level = "High"

    elif len(suspicious_indicators) > 0:

        risk_level = "Medium"

    else:

        risk_level = "Low"


    # --------------------------------------
    # ANALYSIS RESULT
    # --------------------------------------

    if integrity_status == "Tampered":

        analysis_status = "Suspicious"

        message = (

            "Forensic analysis completed. "
            "Evidence integrity could not be verified."

        )

    elif risk_level == "High":

        analysis_status = "Suspicious"

        message = (

            "Forensic analysis completed. "
            "High-risk indicators were detected."

        )

    elif risk_level == "Medium":

        analysis_status = "Warning"

        message = (

            "Forensic analysis completed. "
            "Some suspicious indicators require attention."

        )

    else:

        analysis_status = "Safe"

        message = (

            "Forensic analysis completed successfully. "
            "No suspicious indicators were detected."

        )


    return {

        "analysis_status":
            analysis_status,

        "integrity_status":
            integrity_status,

        "risk_level":
            risk_level,

        "file_category":
            get_file_category(file_name),

        "file_extension":
            extension if extension else "No extension",

        "original_sha256":
            original_hash,

        "current_sha256":
            current_hash,

        "file_size":
            file_size,

        "file_type":
            file_type,

        "suspicious_indicators":
            suspicious_indicators,

        "message":
            message

    }