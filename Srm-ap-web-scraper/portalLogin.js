import puppeteer from "puppeteer";
import fs from "fs";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import terminalImage from "terminal-image";
import FormData from "form-data";

const main = async () => {
  try {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const loginUrl =
      "https://student.srmap.edu.in/srmapstudentcorner/StudentLoginPage";
    await page.goto(loginUrl, { waitUntil: "networkidle2" });

    // =========================
    // STEP 1: Get JSESSIONID
    // =========================
    const cookies = await page.cookies();
    const jsession = cookies.find((c) => c.name === "JSESSIONID");
    if (!jsession) throw new Error("JSESSIONID not found");

    const jsessionValue = jsession.value;
    console.log("JSESSIONID:", jsessionValue);

    // =========================
    // STEP 2: Fetch captcha
    // =========================
    const captchaUrl =
      "https://student.srmap.edu.in/srmapstudentcorner/captchas";

    await page.setCookie({
      name: "JSESSIONID",
      value: jsessionValue,
      domain: "student.srmap.edu.in",
      path: "/srmapstudentcorner",
    });

    const captchaResponse = await page.goto(captchaUrl, {
      waitUntil: "domcontentloaded",
    });

    const captchaBuffer = await captchaResponse.buffer();


    try {
      const image = await terminalImage.buffer(captchaBuffer);
      console.log(image);
    } catch {
      console.log("Captcha preview failed (terminal)");
    }

    console.log("Captcha fetched");

    await browser.close();

    // =========================
    // STEP 3: Send captcha to ML model
    // =========================
    console.log("Sending captcha to ML model...");

    const formData = new FormData();
    formData.append("file", captchaBuffer, {
      filename: "captcha.png",
      contentType: "image/png",
    });

    const captchaSolveResponse = await fetch(
      "http://127.0.0.1:6000/captcha",
      {
        method: "POST",
        body: formData,
        headers: formData.getHeaders(),
      }
    );

    if (!captchaSolveResponse.ok) {
      throw new Error("Captcha model failed");
    }

    const ccode = (await captchaSolveResponse.text()).trim();
    console.log("Solved captcha:", ccode);

    // =========================
    // STEP 4: Login
    // =========================
    console.log("Logging in...");

    const loginForm = new URLSearchParams();
    loginForm.append("txtUserName", "AP2411xxxxxxx");
    loginForm.append("txtAuthKey", "Mikey@2k7");
    loginForm.append("ccode", ccode);

    const loginResponse = await fetch(
      "https://student.srmap.edu.in/srmapstudentcorner/StudentLoginToPortal",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: `JSESSIONID=${jsessionValue}`,
          Referer:
            "https://student.srmap.edu.in/srmapstudentcorner/StudentLoginPage",
        },
        body: loginForm.toString(),
      }
    );

    const loginHtml = await loginResponse.text();

    if (
      loginHtml.includes("Invalid Captcha") ||
      loginHtml.includes("Invalid Login")
    ) {
      throw new Error("Login failed (captcha or credentials)");
    }

    console.log("Login successful");

    // =========================
    // STEP 5: Fetch attendance
    // =========================
    console.log("Fetching attendance report...");

    const reportForm = new URLSearchParams();
    reportForm.append("ids", "3");

    const reportResponse = await fetch(
      "https://student.srmap.edu.in/srmapstudentcorner/students/report/studentreportresources.jsp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: `JSESSIONID=${jsessionValue}`,
          Referer:
            "https://student.srmap.edu.in/srmapstudentcorner/StudentLoginPage",
        },
        body: reportForm.toString(),
      }
    );

    const reportHtml = await reportResponse.text();
    console.log("Attendance report fetched");

    // =========================
    // STEP 6: Parse attendance
    // =========================
    console.log("Extracting data...");

    const $ = cheerio.load(reportHtml);
    const rows = $("#tblSubjectWiseAttendance tr");
    const attendanceData = [];

    for (const row of rows) {
      const tds = $(row).find("td");
      if (tds.length === 9) {
        attendanceData.push({
          subjectCode: $(tds[0]).text().trim(),
          subjectName: $(tds[1]).text().trim(),
          classesConducted: $(tds[2]).text().trim(),
          present: $(tds[3]).text().trim(),
          attendancePercent: $(tds[8]).text().trim(),
        });
      }
    }


    console.log("\nAttendance Data:");
    console.table(attendanceData);


  } catch (err) {
    console.error("Error:", err.message);
  }
};

await main();
