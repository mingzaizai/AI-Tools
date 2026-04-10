
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const extractTextFromFile = (file: File): Promise<string> => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'txt') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file, 'UTF-8');
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('读取文件失败'));
    });
  }
  if (ext === 'docx') {
    return import('mammoth').then(mammoth =>
      file.arrayBuffer().then(buf =>
        mammoth.extractRawText({ arrayBuffer: buf }).then(r => r.value)
      )
    );
  }
  if (ext === 'doc') {
    return Promise.reject(new Error('.doc 格式不支持，请用 Word 另存为 .docx 后重新上传'));
  }
  return Promise.reject(new Error('不支持的文件格式，请上传 .txt 或 .docx 文件'));
};

export const throttle = <F extends (...args: any[]) => void>(func: F, limit: number): F => {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  } as F;
};
