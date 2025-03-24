import React, { useState, useRef, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  message,
  Checkbox,
  Select,
} from "antd";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";
import "antd/dist/reset.css";
import logo from "./Images/cryokologo.png";
message.config({
  duration: 3,
  maxCount: 3,
});
const { TextArea } = Input;
const { Option } = Select;
const ProductOption = ({ value }) => <Option value={value}>{value}</Option>;
const FrequencyOption = ({ value }) => <Option value={value}>{value}</Option>;
export default function FormComponent() {
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const sigCanvas = useRef();
  const [signatureData, setSignatureData] = useState("");
  const [productForm] = Form.useForm(); // Form for "Products Used"
  const [mainForm] = Form.useForm();
  const [address, setAddress] = useState("");
  const [formValues, setFormValues] = useState({
    productsUsed: "",
    frequency: "",
  });
  const handleDropdownChange = (value, field) => {
    setFormValues((prevValues) => ({
      ...prevValues,
      [field]: value, // Update the specific field
    }));

  };

  const updateCanvasSize = () => {
    if (sigCanvas.current) {
      const parent = sigCanvas.current.getCanvas().parentNode;
      setCanvasSize({ width: parent.offsetWidth, height: parent.offsetHeight });
    }
  };

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const styl = `
 .ant-form-item .ant-form-item-label >label {
    position: relative;
    display: inline-flex
;
    align-items: center;
    max-width: 100%;
    height: 32px;
    color: rgba(0, 0, 0, 0.88);
    font-size: 17px;
}
    .ant-form-item .ant-form-item-label >label {
    position: relative;
    display: inline-flex
;
    align-items: center;
    max-width: 100%;
    height: 32px;
    color: #1364AE;
    font-size: 17px;
}
    .ant-checkbox-wrapper {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    color: rgba(0, 0, 0, 0.88);
    font-size: 18px;
    line-height: 1.5714285714285714;
    list-style: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
    display: inline-flex
;
    align-items: baseline;
    cursor: pointer;
}
  `;

  const [checkboxes, setCheckboxes] = useState({
    pregnant: false,
    nursing: false,
    skinAllergies: false,
    allergiesToSepcificIngredientsOrProducts: false,
    medicalConditions: false,
    recentFacialSurgeriesOrTreatment: false,
    otherMedicalConcerns: false,
    oily: false,
    sensitive: false,
    dry: false,
    acneProne: false,
    combination: false,
    aging: false,
    other: false,
  });

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;

    setCheckboxes((prev) => ({
      ...prev,
      [name]: checked,
    }));

    setFormData((prev) => ({
      ...prev,
      [name]: checked ? prev[name] || "" : "", // Ensure value is retained correctly
    }));

 
  };

  const handleAddressChange = (e) => {
    let value = e.target.value;
    let lines = value.split("\n");

    // Limit strictly to 5 rows
    if (lines.length > 3 || value.length > 100) {
      message.warning(
        "Input limited to 3 lines, 100 characters. Excess text won't be included."
      );
      value = lines.slice(0, 2).join("\n"); // Trim excess lines
    }

    setAddress(value); // Update state only if within limits
  };

    const handleSubmit = async (values) => {
    if (!signatureData) {
      message.error(
        "Please provide a signature and click save signature button before submitting the form."
      );
      return;
    }

    setLoading(true);

    const formattedDate = values.date ? values.date.format("YYYY-MM-DD") : "";

    const formDataObject = {
      ...values,
      date: formattedDate,
      signature: signatureData,
      address: address,
      allergiesToSepcificIngredientsOrProducts:
        values.allergiesToSepcificIngredientsOrProducts ||
        formData.allergiesToSepcificIngredientsOrProducts ||
        "",
      recentFacialSurgeriesOrTreatment:
        values.recentFacialSurgeriesOrTreatment ||
        formData.recentFacialSurgeriesOrTreatment ||
        "",
      otherMedicalConcerns:
        values.otherMedicalConcerns || formData.otherMedicalConcerns || "",
      other: values.other || formData.other || "",
    };



    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbxNk6CJ55_8jygJFZEy5S3jVyj-GId40evlGMoYixVC625z6nN-A18P-wAHewb1xP39/exec",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: JSON.stringify(formDataObject),
        }
      );

      const text = await response.text();
      const result = JSON.parse(text);

      if (result.status === "success") {
        message.success("Form submitted successfully!");
        generatePDF(formDataObject, checkboxes);
        mainForm.resetFields();
        setSignatureData(null);
        setAddress("");
        if (sigCanvas.current) {
          sigCanvas.current.clear();
        }

        setCheckboxes({
          pregnant: false,
          nursing: false,
          skinAllergies: false,
          allergiesToSepcificIngredientsOrProducts: false,
          medicalConditions: false,
          recentFacialSurgeriesOrTreatment: false,
          otherMedicalConcerns: false,
          oily: false,
          sensitive: false,
          dry: false,
          acneProne: false,
          combination: false,
          aging: false,
          other: false,
        });
      
        setFormData({
          allergiesToSepcificIngredientsOrProducts: "",
          recentFacialSurgeriesOrTreatment: "",
          otherMedicalConcerns: "",
          other: "",
        });
        
      } else {
        message.error(`Error: ${result.message}`);
      }
    } catch (error) {
      message.error("An error occurred while saving data.");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (formData, checkboxes) => {
    const doc = new jsPDF();
    const getBase64Image = (imgUrl, callback) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Prevent CORS issues
      img.src = imgUrl;
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png"); // Convert to Base64
        callback(dataURL);
      };
    };
    getBase64Image(logo, (base64Image) => {
      doc.addImage(base64Image, "PNG", 18, 1, 40, 40); // Add image before text
      // Set up the font for the document
      doc.setFont("helvetica", "normal");

      doc.setFontSize(12); // Smaller font for header
      doc.text(
        "Sree Perthana Enterprises, 9/4-A, Sriram Layout, Coimbatore -641 011",
        60,
        18
      );
      doc.text(
        "cryocbe@gmail.com | www.cryoko.com | Tel: 0422 490 8701",
        60,
        23
      );

      // Add the form title
      doc.setFontSize(18); // Larger font for title
      doc.setFont("helvetica", "bold");
      doc.text("UNDERTAKING AND CONSENT FORM", 20, 47);
      doc.setLineWidth(0.8);
      doc.line(20, 49, 135, 49);

      // Dear Guest Message (Wrap text properly)
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const greetingText =
        "Dear Guest, \nWe request you to kindly read through the below and sign this undertaking and consent form along with your full legal name.";

      // Split long greeting text to fit within page width
      const greetingTextLines = doc.splitTextToSize(greetingText, 175); // Split long text into lines that fit within 180px width
      let yOffset = 55; // Starting yOffset position for text

      // Add each line of greeting text with proper yOffset
      greetingTextLines.forEach((line) => {
        doc.text(line, 20, yOffset);
        yOffset += 5; // Increase yOffset to move to the next line
      });

      const medicalInformationOptions = [
        { label: "Pregnant", key: "pregnant" },
        { label: "Nursing", key: "nursing" },
        { label: "Skin Allergies", key: "skinAllergies" },
        {
          label: "Allergies To Specific Ingredients Or Products",
          key: "allergiesToSepcificIngredientsOrProducts",
        },
        {
          label: "Recent Facial Surgeries Or Treatment",
          key: "recentFacialSurgeriesOrTreatment",
        },
        { label: "Other Medical Concerns", key: "otherMedicalConcerns" },
      ];

      yOffset += 5; // Add spacing before Skin History
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("MEDICAL INFORMATION", 20, yOffset);
      doc.setFontSize(12);
      yOffset += 7;
      doc.setFont("helvetica", "normal");

      const otherMedicalConcernsText =
        formData?.otherMedicalConcerns?.trim() || "None";
      const recentFacialSurgeriesOrTreatmentText =
        formData?.recentFacialSurgeriesOrTreatment?.trim() || "None";
      const allergiesToSepcificIngredientsOrProductsText =
        formData?.allergiesToSepcificIngredientsOrProducts?.trim() || "None";
    

      if (allergiesToSepcificIngredientsOrProductsText !== "") {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
      }

      if (recentFacialSurgeriesOrTreatmentText !== "") {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);

        // const wrappedText = doc.splitTextToSize(`Details: ${otherMedicalConcernsText}`, 160);

        // wrappedText.forEach((line) => {
        //   doc.text(line, 30, yOffset);
        //   yOffset += 7;
        // });

        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
      }

      if (otherMedicalConcernsText !== "") {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);

        // const wrappedText = doc.splitTextToSize(`Details: ${otherMedicalConcernsText}`, 160);

        // wrappedText.forEach((line) => {
        //   doc.text(line, 30, yOffset);
        //   yOffset += 7;
        // });

        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
      }

      // Print a test line in PDF to confirm text rendering works
      // const otherMedicalConcerns = formData?.otherMedicalConcerns?.trim() || "";
      // Loop through Medical Information options
      medicalInformationOptions.forEach((option) => {
        const isChecked = !!checkboxes?.[option.key]; // Ensure boolean
        const otherMedicalConcernsTextInput = formData?.[option.key]
          ? formData[option.key].trim()
          : ""; // Get text input safely
        const recentFacialSurgeriesOrTreatmentTextInput = formData?.[option.key]
          ? formData[option.key].trim()
          : ""; // Get text input safely
        const allergiesToSepcificIngredientsOrProductsTextInput = formData?.[
          option.key
        ]
          ? formData[option.key].trim()
          : ""; // Get text input safely

        // Draw checkbox
        doc.setFont("helvetica", "normal");
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.rect(20, yOffset - 3.5, 4, 4);

        // Add tick mark if checked
        doc.setFont("Zapfdingbats");
        doc.setTextColor(0, 0, 0);
        const symbol = isChecked ? "4" : "";
        doc.text(`${symbol}`, 20, yOffset - 0.1);

        // Print label text
        doc.setFont("helvetica", "normal");
        doc.text(option.label, 27, yOffset);
        yOffset += 7;

        if (option.key === "allergiesToSepcificIngredientsOrProducts") {
          if (allergiesToSepcificIngredientsOrProductsTextInput !== "") {
            doc.setFont("helvetica", "bold");
            // doc.setTextColor(100);

            const wrappedText = doc.splitTextToSize(
              `Specific: ${allergiesToSepcificIngredientsOrProductsTextInput}`,
              166
            );

            wrappedText.forEach((line, index) => {
              doc.text(line, 27, yOffset - 2);
              yOffset += 5;
            });

            doc.setTextColor(0);
            doc.setFont("helvetica", "normal");
          } else {
            // console.warn(
            //   "⚠ No text input found for allergiesToSepcificIngredientsOrProductsTextInput!"
            // );
          }
        }

        // ✅ Check if Text Input Exists for "Other Medical Concerns"
        if (option.key === "recentFacialSurgeriesOrTreatment") {
          if (recentFacialSurgeriesOrTreatmentTextInput !== "") {
            doc.setFont("helvetica", "bold");
            // doc.setTextColor(100);

            // Wrap text properly
            const wrappedText = doc.splitTextToSize(
              `Specific: ${recentFacialSurgeriesOrTreatmentTextInput}`,
              166
            );

            wrappedText.forEach((line, index) => {
              doc.text(line, 27, yOffset - 2);
              yOffset += 5;
            });

            doc.setTextColor(0);
            doc.setFont("helvetica", "normal");
          } else {
            // console.warn(
            //   "⚠ No text input found for recentFacialSurgeriesOrTreatmentTextInput!"
            // );
          }
        }

        if (option.key === "otherMedicalConcerns") {
          if (otherMedicalConcernsTextInput !== "") {
            doc.setFont("helvetica", "bold");
            // doc.setTextColor(100);

            // Wrap text properly
            const wrappedText = doc.splitTextToSize(
              `Specific: ${otherMedicalConcernsTextInput}`,
              166
            );

            wrappedText.forEach((line, index) => {
              doc.text(line, 27, yOffset - 2);
              yOffset += 5;
            });

            doc.setTextColor(0);
            doc.setFont("helvetica", "normal");
          } else {
            // console.warn("⚠ No text input found for Other Medical Concerns!");
          }
        }
      });

      // Skin History Section
      const skinHistoryOptions = [
        { label: "Oily", key: "oily" },
        { label: "Sensitive", key: "sensitive" },
        { label: "Dry", key: "dry" },
        { label: "Acne-Prone", key: "acneProne" },
        { label: "Combination", key: "combination" },
        { label: "Aging", key: "aging" },
        { label: "Other", key: "other" },
      ];

      yOffset += 3; // Add spacing before Skin History
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SKIN HISTORY", 20, yOffset);
      doc.setFontSize(12);
      yOffset += 7;
      doc.setFont("helvetica", "normal");

      // Loop through Skin History options
      skinHistoryOptions.forEach((option) => {
        const isChecked = !!checkboxes?.[option.key]; // Ensure boolean
        const textInput = formData?.[option.key]?.trim() || ""; // Get text input safely

        // Draw checkbox
        doc.setFont("helvetica", "normal");
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.rect(20, yOffset - 3.5, 4, 4);

        // Add tick mark if checked
        doc.setFont("Zapfdingbats");
        doc.setTextColor(0, 0, 0);
        const symbol = isChecked ? "4" : "";
        doc.text(`${symbol}`, 20, yOffset - 0.1);

        // Print label text
        doc.setFont("helvetica", "normal");
        doc.text(option.label, 27, yOffset);
        yOffset += 7;

        // If "Other" is selected, add text input
        if (option.key === "other" && textInput !== "") {
          doc.setFont("helvetica", "bold");
          // doc.setTextColor(100);
          const wrappedText = doc.splitTextToSize(
            `Specific: ${textInput}`,
            166

          );

          wrappedText.forEach((line) => {
            doc.text(line, 27, yOffset - 2);
            yOffset += 5;
          });

          doc.setTextColor(0);
          doc.setFont("helvetica", "normal");
        }
      });

      yOffset += 3; // Add spacing before Skin Care Routine
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("CURRENT SKIN CARE ROUTINE", 20, yOffset);
      doc.setFontSize(12);
      yOffset += 7;
      doc.setFont("helvetica", "bold");

      // Define form fields safely
      const productsUsed = formData?.["products used"]?.trim() || "N/A";
      const frequency = formData?.frequency?.trim() || "N/A";
      const concernOrGoals = formData?.["concern or goals"]?.trim() || "N/A";

      // Display the information
      doc.text("Products Used:", 20, yOffset);
      doc.setFont("helvetica", "normal");
      // doc.text(productsUsed, 60, yOffset);
      const wrappedProducts = doc.splitTextToSize(productsUsed, 134);
      wrappedProducts.forEach((line) => {
        doc.text(line, 60, yOffset);
        yOffset += 5;

      });
      yOffset += 2;

      doc.setFont("helvetica", "bold");
      doc.text("Frequency:", 20, yOffset);
      doc.setFont("helvetica", "normal");
      doc.text(frequency, 60, yOffset);
      yOffset += 7;

      doc.setFont("helvetica", "bold");
      doc.text("Concern or Goals:", 20, yOffset);
      doc.setFont("helvetica", "normal");

      // Wrap long text properly to fit in the PDF
      const wrappedConcerns = doc.splitTextToSize(concernOrGoals, 134);
      wrappedConcerns.forEach((line) => {
        doc.text(line, 60, yOffset);
        yOffset += 5;
      });
      doc.addPage(); // Move to a new page

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("STATEMENT OF UNDERTAKING", 20, 20);
      yOffset += 9;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      const undertakingText =
        "I have carefully read this document and I fully understand its content. I have been personally briefed about the treatment and its outcomes. Knowing the risks involved and the contraindications related - nevertheless, I choose voluntarily to participate in the cryotherapy treatment. I am in good health and have no physical condition expressed in the contraindications or otherwise which would preclude me from safely participating in such treatment. This statement constitutes a waiver and release of any liability on Cryoko Wellness and all of its employees, owners, legal heirs, successors, and legal representatives against any harm, personal injury, or any other unprecedented consequences resulting from the use of the whole body cryotherapy equipment and treatment.";

      const undertakingTextLines = doc.splitTextToSize(undertakingText, 160);
      doc.text(undertakingTextLines, 20, 27);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      yOffset += 10;

      doc.text("Name: ", 20, 80);
      doc.setFont("helvetica", "normal");
      doc.text(formData.name || "N/A", 85, 80);
      yOffset += 7;

      doc.setFont("helvetica", "bold");
      doc.text("Address: ", 20, 90);
      doc.setFont("helvetica", "normal");
      const addressLines = doc.splitTextToSize(formData.address || "N/A", 105);
      doc.text(addressLines, 85, 90);
      yOffset += addressLines.length * 7;

      doc.setFont("helvetica", "bold");
      doc.text("Contact Number: ", 20, 115);
      doc.setFont("helvetica", "normal");
      doc.text(formData.contact || "N/A", 85, 115);
      yOffset += 7;

      doc.setFont("helvetica", "bold");
      doc.text("Emergency Contact Name: ", 20, 125);
      doc.setFont("helvetica", "normal");
      doc.text(formData.emergencyName || "N/A", 85, 125);
      yOffset += 7;

      doc.setFont("helvetica", "bold");
      doc.text("Emergency Contact Number: ", 20, 135);
      doc.setFont("helvetica", "normal");
      doc.text(formData.emergencyNumber || "N/A", 85, 135);
      yOffset += 7;

      doc.setFont("helvetica", "bold");
      doc.text("Date: ", 20, 145);
      doc.setFont("helvetica", "normal");
      doc.text(formData.date || "N/A", 85, 145);
      yOffset += 10;
      if (formData.signature) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Signature:", 20, 155);
        yOffset += 10;

        doc.addImage(formData.signature, "PNG", 20, 160, 150, 100);
        yOffset += 60; // Adjust space after signature
      }

      // Signature Section (If signature exists)
      if (formData.signatureData) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Signature:", 20, yOffset);
        doc.addImage(formData.signatureData, "PNG", 20, yOffset + 10, 150, 100);
        yOffset += 60;
      }



      const now = new Date();
      const istNow = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).formatToParts(now);

      const year = istNow.find((part) => part.type === "year").value;
      const month = istNow.find((part) => part.type === "month").value;
      const day = istNow.find((part) => part.type === "day").value;
      let hour = istNow.find((part) => part.type === "hour").value;
      const minute = istNow.find((part) => part.type === "minute").value;
      const ampm = istNow
        .find((part) => part.type === "dayPeriod")
        .value.toUpperCase();

      hour = hour.padStart(2, "0");

      // Format file name as Name_YYYY_MM_DD HH:MMAM/PM.pdf
      const userName = formData.name
        ? formData.name.replace(/\s+/g, "_")
        : "User";
      const fileName = `${userName} ${year}_${month}_${day} ${hour}:${minute}${ampm}.pdf`;

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
      }

      // Save PDF
      doc.save(fileName);
    });
  };

  const saveSignature = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const signatureImage = sigCanvas.current
        .getCanvas()
        .toDataURL("image/png");
      setSignatureData(signatureImage);
      setTimeout(() => message.success("Signature saved successfully!"), 0);
    } else {
      message.error("Please draw a signature before saving.");
    }
  };

  return (
    <>
      <style>{styl}</style>

      <div className="container-fluid bg-white containerWidth">
        <div className="container">
          <div
            className="row d-flex align-items-center justify-content-center rounded-3"
            style={{ backgroundColor: "#1364AE" }}
          >
            <div className="col-3 col-md-2 col-lg-2 ">
              <img
                src={logo}
                alt="Cryoko logo"
                className="img-fluid ms-lg-3 cryokologo"
              />
            </div>
            <div className="col-9 col-md-10 col-lg-6 justify-content-center mt-3 mt-lg-3 text-white ">
              <p className="addressText">
                Sree Pertharna Enterprises, <br /> 9/4-A, Sriram Layout,
                Coimbatore -641 011 <br />
                cryocbe@gmail.com | www.cryoko.com | <br /> Tel: 0422 490 8701
              </p>
            </div>
          </div>
        </div>
        <div className="container mt-4">
          <div className="row">
            <div className="col-12">
              <p
                className="text-decoration-underline text-center m-0"
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#1364AE",
                }}
              >
                UNDERTAKING AND CONSENT FORM
              </p>
            </div>
            <div className="row">
              <div className="col-12">
                <p style={{ fontSize: "18px" }} className="mt-1">
                  Dear Guest,
                  <br />
                  We request you to kindly read through the below and sign this
                  undertaking and consent form along with your full legal name
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          // className="container mt-1 rounded-5 p-3 p-lg-5"
          className="container mt-1 rounded-5 "
          style={{
            display: "flex",
            justifyContent: "center",
            alignContent: "center",
          }}
        >
          <div
            className="row rounded-5 p-3 p-lg-5"
            style={{ backgroundColor: "#1364AE20" }}
          >
            <div className="col-12 col-lg-6 " style={{ fontSize: "18px" }}>
              <div>
                <p
                  className="m-0 p-0"
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#1364AE",
                  }}
                >
                  MEDICAL INFORMATION
                </p>
                <p className="m-0 p-0">
                  Please check any of the following that apply to you:
                </p>
              </div>
              <div className="checkbox-label mt-2">
                <Checkbox
                  name="pregnant"
                  checked={checkboxes.pregnant}
                  onChange={handleCheckboxChange}
                >
                  Pregnant
                </Checkbox>
              </div>

              <div className="checkbox-label">
                <Checkbox
                  name="nursing"
                  checked={checkboxes.nursing}
                  onChange={handleCheckboxChange}
                >
                  Nursing
                </Checkbox>
              </div>

              <div className="checkbox-label">
                <Checkbox
                  name="skinAllergies"
                  checked={checkboxes.skinAllergies}
                  onChange={handleCheckboxChange}
                >
                  Skin Allergies
                </Checkbox>
              </div>

              <div className="checkbox-container">
                <Checkbox
                  name="allergiesToSepcificIngredientsOrProducts"
                  checked={checkboxes.allergiesToSepcificIngredientsOrProducts}
                  onChange={handleCheckboxChange}
                >
                  Allergies To Specific Ingredients Or Products
                </Checkbox>
                {checkboxes.allergiesToSepcificIngredientsOrProducts && (
                  <TextArea
                    rows={3}
                    placeholder="Please specify..."
                    showCount
                    maxLength={100}
                    value={
                      formData.allergiesToSepcificIngredientsOrProducts || ""
                    }
                    onChange={(e) => {
                      let value = e.target.value;
                      let lines = value.split("\n");
                      if (lines.length > 2 || value.length > 100) {
                        message.warning(
                          "Input limited to 2 lines, 100 characters. Excess text won't be included."
                        );
                        value = lines.slice(0, 2).join("\n"); // Trim excess lines
                      }
                      setFormData((prev) => ({
                        ...prev,
                        allergiesToSepcificIngredientsOrProducts: value, // ✅ Store input properly
                      }));
                    }}
                    className="input-box"
                  />
                )}
              </div>

              <div className="checkbox-container mt-2">
                <Checkbox
                  name="recentFacialSurgeriesOrTreatment"
                  checked={checkboxes.recentFacialSurgeriesOrTreatment}
                  onChange={handleCheckboxChange}
                >
                  Recent Facial Surgeries Or Treatment
                </Checkbox>
                {checkboxes.recentFacialSurgeriesOrTreatment && (
                  <TextArea
                    rows={3}
                    showCount
                    maxLength={100}
                    placeholder="Please specify..."
                    value={formData.recentFacialSurgeriesOrTreatment || ""}
                    onChange={(e) => {
                      let value = e.target.value;
                      let lines = value.split("\n");
                      if (lines.length > 2 || value.length > 100) {
                        message.warning(
                          "Input limited to 2 lines, 100 characters. Excess text won't be included."
                        );
                        value = lines.slice(0, 2).join("\n"); // Trim excess lines
                      }
                      setFormData((prev) => ({
                        ...prev,
                        recentFacialSurgeriesOrTreatment: value, // ✅ Store input properly
                      }));
                    }}
                    className="input-box"
                  />
                )}
              </div>

              <div className="checkbox-container mt-2">
                <Checkbox
                  name="otherMedicalConcerns"
                  checked={checkboxes.otherMedicalConcerns}
                  onChange={handleCheckboxChange}
                >
                  Other Medical Concerns
                </Checkbox>
                {checkboxes.otherMedicalConcerns && (
                  <TextArea
                    rows={3}
                    showCount
                    maxLength={100}
                    placeholder="Please specify..."
                    value={formData.otherMedicalConcerns || ""}
                    onChange={(e) => {
                      let value = e.target.value;
                      let lines = value.split("\n");
                      if (lines.length > 2 || value.length > 100) {
                        message.warning(
                          "Input limited to 2 lines, 100 characters. Excess text won't be included."
                        );
                        value = lines.slice(0, 2).join("\n"); // Trim excess lines
                      }

                      setFormData((prev) => ({
                        ...prev,
                        otherMedicalConcerns: value, // ✅ Store input properly
                      }));
                    }}
                    className="input-box"
                  />
                )}
              </div>
            </div>
          {/* <div
              className="col-12 col-lg-6 mt-3 mt-lg-0"
              style={{ fontSize: "18px" }}
            >
              <div>
                <p
                  className="m-0 p-0"
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#1364AE",
                  }}
                >
                  SKIN HISTORY
                </p>
                <p className="m-0 p-0">
                  Please check any of the following that apply to you:
                </p>
              </div>
              <div className="d-flex gap-5 mt-2">
                <div style={{ width: "35%" }}>
                  <Checkbox
                    name="oily"
                    checked={checkboxes.oily}
                    onChange={handleCheckboxChange}
                  >
                    Oily
                  </Checkbox>
                </div>
                <div style={{ width: "35%" }}>
                  <Checkbox
                    name="sensitive"
                    checked={checkboxes.sensitive}
                    onChange={handleCheckboxChange}
                  >
                    Sensitive
                  </Checkbox>
                </div>
              </div>

              <div className="d-flex gap-5 mt-2">
                <div style={{ width: "35%" }}>
                  <Checkbox
                    name="dry"
                    checked={checkboxes.dry}
                    onChange={handleCheckboxChange}
                  >
                    Dry
                  </Checkbox>
                </div>
                <div style={{ width: "50%" }}>
                  <Checkbox
                    name="acneProne"
                    checked={checkboxes.acneProne}
                    onChange={handleCheckboxChange}
                  >
                    Acne-Prone
                  </Checkbox>
                </div>
              </div>

              <div className="d-flex gap-5 mt-2">
                <div style={{ width: "35%" }}>
                  <Checkbox
                    name="combination"
                    checked={checkboxes.combination}
                    onChange={handleCheckboxChange}
                  >
                    Combination
                  </Checkbox>
                </div>
                <div style={{ width: "35%" }}>
                  <Checkbox
                    name="aging"
                    checked={checkboxes.aging}
                    onChange={handleCheckboxChange}
                  >
                    Aging
                  </Checkbox>
                </div>
              </div>
              <div className="checkbox-container mt-2">
                <Checkbox
                  name="other"
                  checked={checkboxes.other}
                  onChange={handleCheckboxChange}
                >
                  Other
                </Checkbox>
                {checkboxes.other && (
                  <TextArea
                    rows={3}
                    showCount
                    maxLength={100}
                    placeholder="Please specify..."
                    value={formData.other || ""}
                    onChange={(e) => {
                      let value = e.target.value;
                      let lines = value.split("\n");
                      if (lines.length > 2 || value.length > 100) {
                        message.warning(
                          "Input limited to 2 lines, 100 characters. Excess text won't be included."
                        );
                        value = lines.slice(0, 2).join("\n"); // Trim excess lines
                      }

                      setFormData((prev) => ({
                        ...prev,
                        other: value, // ✅ Store input properly
                      }));
                    }}
                    className="input-box"
                  />
                )}
              </div>
            </div> */}
            <div className="col-12 col-lg-6 mt-3 mt-lg-0" style={{ fontSize: "18px" }}>
  <div>
    <p className="m-0 p-0" style={{ fontSize: "20px", fontWeight: "bold", color: "#1364AE" }}>
      SKIN HISTORY
    </p>
    <p className="m-0 p-0">Please check any of the following that apply to you:</p>
  </div>

  {/* First row */}
  <div className="d-flex gap-5 mt-2">
    <div style={{ width: "35%" }}>
      <Checkbox name="oily" checked={checkboxes.oily} onChange={handleCheckboxChange}>
        Oily
      </Checkbox>
    </div>
    <div style={{ width: "35%" }}>
      <Checkbox name="sensitive" checked={checkboxes.sensitive} onChange={handleCheckboxChange}>
        Sensitive
      </Checkbox>
    </div>
  </div>

  {/* Second row */}
  <div className="d-flex gap-5 mt-2">
    <div style={{ width: "35%" }}>
      <Checkbox name="dry" checked={checkboxes.dry} onChange={handleCheckboxChange}>
        Dry
      </Checkbox>
    </div>
    <div style={{ width: "35%" }}>
      <Checkbox name="acneProne" checked={checkboxes.acneProne} onChange={handleCheckboxChange}>
        Acne-Prone
      </Checkbox>
    </div>
  </div>

  {/* Third row */}
  <div className="d-flex gap-5 mt-2">
    <div style={{ width: "35%" }}>
      <Checkbox name="combination" checked={checkboxes.combination} onChange={handleCheckboxChange}>
        Combination
      </Checkbox>
    </div>
    <div style={{ width: "35%" }}>
      <Checkbox name="aging" checked={checkboxes.aging} onChange={handleCheckboxChange}>
        Aging
      </Checkbox>
    </div>
  </div>

  {/* Fourth row - Force "Other" to align under "Aging" */}
  <div className="d-flex gap-5 mt-2">
    <div style={{ width: "35%", visibility: "hidden" }}></div> {/* Empty div to maintain spacing */}
    <div style={{ width: "35%" }}>
      <Checkbox name="other" checked={checkboxes.other} onChange={handleCheckboxChange}>
        Other
      </Checkbox>
    </div>
  </div>

  {/* Show TextArea when "Other" is checked */}
  {checkboxes.other && (
    <div className="mt-2">
      <TextArea
        rows={3}
        showCount
        maxLength={100}
        placeholder="Please specify..."
        value={formData.other || ""}
        onChange={(e) => {
          let value = e.target.value;
          let lines = value.split("\n");
          if (lines.length > 2 || value.length > 100) {
            message.warning("Input limited to 2 lines, 100 characters. Excess text won't be included.");
            value = lines.slice(0, 2).join("\n"); // Trim excess lines
          }

          setFormData((prev) => ({
            ...prev,
            other: value, // ✅ Store input properly
          }));
        }}
        className="input-box"
      />
    </div>
  )}
</div>

          </div>
        </div>
        <Form
          form={mainForm}
          layout="vertical"
          className="mt-1"
          onFinish={handleSubmit}
        >
          <div className="container mt-3" style={{ color: "#1364AE" }}>
            <div className="row">
              <div className="col-12">
                <p
                  className="m-0 p-0"
                  style={{ fontSize: "20px", fontWeight: "bold" }}
                >
                  CURRENT SKIN CARE ROUTINE
                </p>
              </div>
              <div className="row">
                <div className="col-md-6">
                 
                  <Form.Item
                    label="Products used"
                    name="products used"
                    rules={[
                      {
                        required: true,
                        message: "Please enter the products you use",
                      },
                    ]}
                  >
                {/* <Input placeholder="Enter the products you use" showCount  maxLength={100}/> */}
                <Input
    placeholder="Enter the products you use"
    // showCount
    // maxLength={100}
    value={formData.productsUsed || ""}
    onChange={(e) => {
      let value = e.target.value;
      let lines = value.split("\n");

      if (lines.length > 1 || value.length > 100) {
        message.warning("Input limited to 1 line, 100 characters. Excess text won't be included.");
        value = lines[0].slice(0, 100); // Keep only the first line and trim excess text
      }

      setFormData((prev) => ({
        ...prev,
        productsUsed: value, // ✅ Store input properly
      }));
    }}
  />

                    {/* <Select placeholder="Select a product" 
                    onChange={(value) => handleDropdownChange(value, "productsUsed")}>
                      <ProductOption value="Product 1" />
                      <ProductOption value="Product 2" />
                      <ProductOption value="Product 3" />
                    </Select> */}
                  </Form.Item>
                </div>
                <div className="col-md-6">
                  <Form.Item
                    label="Frequency"
                    name="frequency"
                    rules={[
                      {
                        required: true,
                        message: "Please select your frequency",
                      },
                    ]}
                  >
                    <Select placeholder="Select frequency"
                              onChange={(value) => handleDropdownChange(value, "frequency")}
>
                      <FrequencyOption value="High" />
                      <FrequencyOption value="Medium" />
                      <FrequencyOption value="Low" />
                    </Select>
                  </Form.Item>
                </div>
                <div className="col-12">
                  <Form.Item
                    label="Concern or goals"
                    name="concern or goals"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your concern or goals",
                      },
                    
                    ]}
                  >
                    <Input placeholder="Enter your concern or goals"  maxLength={100}/>
                  </Form.Item>
                </div>
              
              </div>
            </div>
          </div>

          <div className="container mt-3">
            <div className="row">
              <div className="col-12">
                <p
                  className="m-0"
                  style={{
                    fontSize: "22px",
                    fontWeight: "bolder",
                    color: "#1364AE",
                  }}
                >
                  STATEMENT OF UNDERTAKING
                </p>
                <p style={{ fontSize: "18px" }}>
                  I have carefully read this document and I fully understand its
                  content. I have been personally briefed about the treatment
                  and its outcomes. Knowing the risks involved and the
                  contraindications related - 1evertheless chose voluntarily to
                  participate in the cryotherapy treatment. I am in good health
                  and have no physical condition expressed in the
                  contraindications or otherwise which would preclude me from
                  safely participating in such treatment. This statement
                  constitutes waiver and release of any and liability on Cryoko
                  Wellness and all of its employees, owners legal heirs,
                  successors and legal representatives against any harm,
                  personal injury or any other unprecedented consequences
                  resulting from the use of the whole body cryotherapy equipment
                  and treatment.
                </p>
              </div>
            </div>
          </div>

          <div className="container mt-3 ">
            <div className="row justify-content-center">
              <div
                className="col-12 col-lg-10  border rounded-5 p-3"
                style={{ backgroundColor: "#1364AE20" }}
              >
                <div className="row">
                  <div className="col-md-6">
                    <Form.Item
                      label="Name"
                      name="name"
                      rules={[
                        { required: true, message: "Please enter your name" },
                        {
                          pattern: /^[A-Za-z. ]+$/,
                          message: "Only letters, spaces, and '.' are allowed",
                        },
                      ]}
                    >
                      <Input placeholder="Enter your name" />
                    </Form.Item>
                  </div>

                  <div className="col-md-6">
                    <Form.Item
                      label="Contact Number"
                      name="contact"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your contact number",
                        },
                        {
                          pattern: /^[0-9+-]+$/,
                          message: "Only numbers, +, and - are allowed",
                        },
                      ]}
                    >
                      <Input
                        maxLength={15}
                        placeholder="Enter contact number"
                      />
                    </Form.Item>
                  </div>
                </div>

                <Form.Item
                  label="Address"
                  name="address"
                  rules={[
                    { required: true, message: "Please enter your address" },
                  ]}
                >
                   <TextArea
                          placeholder="Enter address"
                          value={address}
                          rows={2}
                          onChange={handleAddressChange}
                          autoSize={{ minRows: 3, maxRows: 3 }}
                          maxLength={100}
                          showCount
                        />
                </Form.Item>

                <div className="row">
                  <div className="col-md-6">
                    <Form.Item
                      label="Emergency Contact Name"
                      name="emergencyName"
                      rules={[
                        {
                          required: true,
                          message: "Please enter emergency contact name",
                        },
                        {
                          pattern: /^[A-Za-z. ]+$/,
                          message: "Only letters, spaces, and '.' are allowed",
                        },
                      ]}
                    >
                      <Input placeholder="Enter emergency contact name" />
                    </Form.Item>
                  </div>

                  <div className="col-md-6">
                    <Form.Item
                      label="Emergency Contact Number"
                      name="emergencyNumber"
                      rules={[
                        {
                          required: true,
                          message: "Please enter emergency contact number",
                        },
                        {
                          pattern: /^[0-9+-]+$/,
                          message: "Only numbers, +, and - are allowed",
                        },
                      ]}
                    >
                      <Input
                        maxLength={15}
                        placeholder="Enter emergency contact number"
                      />
                    </Form.Item>
                  </div>
                </div>

                {/* Date - Full Row */}
                <Form.Item
                  label="Date"
                  name="date"
                  rules={[{ required: true, message: "Please select a date" }]}
                >
                  <DatePicker className="w-100" />
                </Form.Item>

                <Form.Item label="Signature" required>
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                      width: canvasSize.width, 
                      height: 500, 
                      className: "border rounded border-3 bg-white",
                    }}
                  />
                  <div className="d-flex justify-content-start gap-2 mt-1">
                    <Button onClick={saveSignature} className="savesignbutton">
                      Save Signature
                    </Button>
                    <Button
                      onClick={() => {
                        sigCanvas.current.clear();
                        setSignatureData("");
                      }}
                      className="clearsignbutton"
                    >
                      Clear
                    </Button>
                  </div>
                </Form.Item>

              </div>
            </div>
          </div>
          <div className="text-center mt-3 pb-3">
            <Button
              htmlType="submit"
              className="submitbutton "
              style={{ fontSize: "1.2rem" }}
              loading={loading}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
}
