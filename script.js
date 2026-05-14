const form = document.getElementById("orderForm");
const orderList = document.getElementById("orderList");

const STORAGE_KEY = "resumeOrdersEncrypted";
const SECRET_KEY = "resume-helper-local-demo-key";

// 你的 Formspree 表单接收地址
const FORM_ENDPOINT = "https://formspree.io/f/mnjwyldj";

function scrollToForm() {
  document.getElementById("formSection").scrollIntoView({
    behavior: "smooth"
  });
}

function showWechat() {
  document.getElementById("wechatModal").style.display = "flex";
}

function hideWechat() {
  document.getElementById("wechatModal").style.display = "none";
}

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* 称呼打码 */
function maskName(name) {
  const text = String(name).trim();

  if (text.length === 0) {
    return "匿名用户";
  }

  if (text.length === 1) {
    return text + "*";
  }

  return text.slice(0, 1) + "*".repeat(text.length - 1);
}

/* 联系方式打码 */
function maskContact(contact) {
  const text = String(contact).trim();

  if (/^\d{11}$/.test(text)) {
    return text.slice(0, 3) + "****" + text.slice(7);
  }

  if (text.length <= 4) {
    return text[0] + "***";
  }

  return text.slice(0, 2) + "****" + text.slice(-2);
}

/* 简单加密：适合本地演示，不适合正式商业级数据安全 */
function simpleEncrypt(text) {
  let result = "";

  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)
    );
  }

  return btoa(unescape(encodeURIComponent(result)));
}

/* 简单解密 */
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

/* 提交到 Formspree，让你邮箱收到客户信息 */
async function sendToFormspree(order) {
  const formData = new FormData();

  formData.append("称呼", order.name);
  formData.append("联系方式", order.phone);
  formData.append("目标岗位", order.job);
  formData.append("服务类型", order.service);
  formData.append("需求说明", order.message);
  formData.append("提交时间", order.submitTime);
  formData.append("_subject", "简历助手收到新的客户需求");

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
    message: document.getElementById("message").value.trim(),
    submitTime: new Date().toLocaleString()
  };

  if (!order.name || !order.phone || !order.job || !order.service || !order.message) {
    alert("请把信息填写完整。");
    submitButton.disabled = false;
    submitButton.textContent = "提交需求";
    return;
  }

  try {
    // 1. 发送到 Formspree，你邮箱会收到
    await sendToFormspree(order);

    // 2. 本地加密保存一份
    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);

    // 3. 页面显示打码后的提交记录
    form.reset();
    loadOrders();

    alert("提交成功！需求已发送，我们会尽快联系你。");
  } catch (error) {
    console.error(error);
    alert("提交失败，请稍后再试，或直接添加微信/电话：15840622209");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "提交需求";
  }
});

loadOrders();