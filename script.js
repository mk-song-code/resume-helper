const form = document.getElementById("orderForm");
const orderList = document.getElementById("orderList");

const STORAGE_KEY = "resumeOrdersEncrypted";
const SECRET_KEY = "resume-helper-local-demo-key";
const FORM_ENDPOINT = "https://formspree.io/f/mnjwyldj";

const packages = {
  basic: {
    name: "简历基础检查",
    price: "5",
    service: "简历基础检查 ￥5",
    wechatQr: "images/wechat-pay-5.jpg",
    alipayQr: "images/alipay-pay-5.jpg"
  },
  layout: {
    name: "简历排版优化",
    price: "9.9",
    service: "简历排版优化 ￥9.9",
    wechatQr: "images/wechat-pay-9-9.jpg",
    alipayQr: "images/alipay-pay-9-9.jpg"
  },
  polish: {
    name: "简历内容润色",
    price: "19.9",
    service: "简历内容润色 ￥19.9",
    wechatQr: "images/wechat-pay-19-9.jpg",
    alipayQr: "images/alipay-pay-19-9.jpg"
  },
  interview: {
    name: "面试自我介绍",
    price: "29.9",
    service: "面试自我介绍 ￥29.9",
    wechatQr: "images/wechat-pay-29-9.jpg",
    alipayQr: "images/alipay-pay-29-9.jpg"
  }
};

let currentPackageKey = "";
let currentPayType = "wechat";

function scrollToPackages() {
  document.getElementById("packagesSection").scrollIntoView({
    behavior: "smooth"
  });
}

function scrollToForm() {
  document.getElementById("formSection").scrollIntoView({
    behavior: "smooth"
  });
}

function openPay(packageKey) {
  currentPackageKey = packageKey;
  currentPayType = "wechat";

  const item = packages[packageKey];

  document.getElementById("payPackageName").textContent = item.name;
  document.getElementById("payPrice").textContent = item.price;

  updatePayQr();
  updateTabState();

  document.getElementById("payModal").style.display = "flex";
}

function closePay() {
  document.getElementById("payModal").style.display = "none";
}

function switchPayTab(type) {
  currentPayType = type;
  updatePayQr();
  updateTabState();
}

function updateTabState() {
  const tabs = document.querySelectorAll(".pay-tabs .tab");

  tabs.forEach((tab) => {
    tab.classList.remove("active");
  });

  if (currentPayType === "wechat") {
    tabs[0].classList.add("active");
  } else {
    tabs[1].classList.add("active");
  }
}

function updatePayQr() {
  const item = packages[currentPackageKey];

  if (!item) {
    return;
  }

  const qrImage = document.getElementById("payQrImage");
  const qrText = document.getElementById("payQrText");

  if (currentPayType === "wechat") {
    qrImage.src = item.wechatQr;
    qrText.textContent = `微信支付：请支付 ￥${item.price}`;
  } else {
    qrImage.src = item.alipayQr;
    qrText.textContent = `支付宝支付：请支付 ￥${item.price}`;
  }
}

function goSubmitAfterPay() {
  const item = packages[currentPackageKey];

  if (!item) {
    alert("请先选择套餐。");
    return;
  }

  closePay();

  const serviceSelect = document.getElementById("service");
  const paymentMethod = document.getElementById("paymentMethod");
  const paymentNote = document.getElementById("paymentNote");

  serviceSelect.value = item.service;
  paymentMethod.value = currentPayType === "wechat" ? "微信支付" : "支付宝支付";

  paymentNote.value = "";
  paymentNote.placeholder = `请填写付款时间 / 付款昵称 / 是否已发截图，需人工核验：￥${item.price}`;

  document.getElementById("selectedPackageText").textContent = item.service;

  scrollToForm();
}

function showWechat() {
  document.getElementById("wechatModal").style.display = "flex";
}

function hideWechat() {
  document.getElementById("wechatModal").style.display = "none";
}

function escapeHTML(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function maskName(name) {
  const text = String(name || "").trim();

  if (text.length === 0) {
    return "匿名用户";
  }

  if (text.length === 1) {
    return text + "*";
  }

  return text.slice(0, 1) + "*".repeat(text.length - 1);
}

function maskContact(contact) {
  const text = String(contact || "").trim();

  if (/^\d{11}$/.test(text)) {
    return text.slice(0, 3) + "****" + text.slice(7);
  }

  if (text.length <= 4) {
    return text[0] + "***";
  }

  return text.slice(0, 2) + "****" + text.slice(-2);
}

function simpleEncrypt(text) {
  let result = "";

  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)
    );
  }

  return btoa(unescape(encodeURIComponent(result)));
}

function simpleDecrypt(encryptedText) {
  try {
    const decoded = decodeURIComponent(escape(atob(encryptedText)));
    let result = "";

    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)
      );
    }

    return result;
  } catch (error) {
    return "[]";
  }
}

function getOrders() {
  const encryptedData = localStorage.getItem(STORAGE_KEY);

  if (!encryptedData) {
    return [];
  }

  const decryptedText = simpleDecrypt(encryptedData);

  try {
    return JSON.parse(decryptedText);
  } catch (error) {
    return [];
  }
}

function saveOrders(orders) {
  const text = JSON.stringify(orders);
  const encryptedText = simpleEncrypt(text);
  localStorage.setItem(STORAGE_KEY, encryptedText);
}

function loadOrders() {
  const orders = getOrders();

  if (orders.length === 0) {
    orderList.innerHTML = "<p class='empty'>暂无提交记录</p>";
    return;
  }

  orderList.innerHTML = "";

  orders.forEach((order, index) => {
    const item = document.createElement("div");
    item.className = "order-item";

    item.innerHTML = `
      <p><strong>${index + 1}. ${escapeHTML(maskName(order.name))}</strong></p>
      <p>联系方式：${escapeHTML(maskContact(order.phone))}</p>
      <p>目标岗位：${escapeHTML(order.job)}</p>
      <p>服务类型：${escapeHTML(order.service)}</p>
      <p>付款方式：${escapeHTML(order.paymentMethod)}</p>
      <p>付款备注：${escapeHTML(order.paymentNote)}</p>
      <p>付款状态：待人工核验，以实际到账为准</p>
      <p>需求说明：${escapeHTML(order.message)}</p>
      <p style="color:#999;font-size:12px;margin-top:6px;">
        称呼和联系方式已打码展示，本地记录已加密保存
      </p>
    `;

    orderList.appendChild(item);
  });

  const clearButton = document.createElement("button");
  clearButton.textContent = "清空本地提交记录";
  clearButton.style.marginTop = "12px";
  clearButton.style.width = "100%";
  clearButton.onclick = clearOrders;

  orderList.appendChild(clearButton);
}

function clearOrders() {
  const confirmClear = confirm("确定要清空本地提交记录吗？清空后无法恢复。");

  if (!confirmClear) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  loadOrders();
  alert("本地提交记录已清空。");
}

async function sendToFormspree(order) {
  const formData = new FormData();

  formData.append("称呼", order.name);
  formData.append("联系方式", order.phone);
  formData.append("目标岗位", order.job);
  formData.append("服务类型", order.service);
  formData.append("付款方式", order.paymentMethod);
  formData.append("付款备注", order.paymentNote);
  formData.append("付款状态", "待人工核验，以实际到账为准");
  formData.append("需求说明", order.message);
  formData.append("提交时间", order.submitTime);
  formData.append("_subject", "简历助手收到新的客户需求：待核验付款");

  const response = await fetch(FORM_ENDPOINT, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("提交到 Formspree 失败");
  }

  return response;
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "提交中...";

  const order = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    job: document.getElementById("job").value.trim(),
    service: document.getElementById("service").value,
    paymentMethod: document.getElementById("paymentMethod").value,
    paymentNote: document.getElementById("paymentNote").value.trim(),
    paymentStatus: "待人工核验，以实际到账为准",
    message: document.getElementById("message").value.trim(),
    submitTime: new Date().toLocaleString()
  };

  if (
    !order.name ||
    !order.phone ||
    !order.job ||
    !order.service ||
    !order.paymentMethod ||
    !order.paymentNote ||
    !order.message
  ) {
    alert("请把信息填写完整。付款备注请填写付款时间、付款昵称或是否已发送截图。");
    submitButton.disabled = false;
    submitButton.textContent = "提交需求，等待人工核验";
    return;
  }

  try {
    await sendToFormspree(order);

    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);

    form.reset();
    document.getElementById("selectedPackageText").textContent = "暂未选择套餐";
    loadOrders();

    alert("提交成功！需求已发送。我们会人工核验付款，确认到账后开始处理。");
  } catch (error) {
    console.error(error);
    alert("提交失败，请稍后再试，或直接添加微信 / 电话：15840622209");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "提交需求，等待人工核验";
  }
});

loadOrders();