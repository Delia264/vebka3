// Функция экспорта в PDF
function exportToPDF(className) {
    // Создаем временный контейнер для PDF
    const tempContainer = document.createElement('div');
    tempContainer.id = 'temp-pdf-container';
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm'; // A4 ширина
    tempContainer.style.padding = '20px';
    tempContainer.style.boxSizing = 'border-box';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    
    // Заголовок PDF
    const title = document.createElement('h1');
    title.textContent = `Расписание для класса ${className}`;
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    title.style.fontSize = '18px';
    title.style.color = '#333';
    
    // Копируем расписание
    const scheduleCopy = document.getElementById('scheduleContainer').cloneNode(true);
    scheduleCopy.style.maxWidth = '100%';
    scheduleCopy.style.overflow = 'auto';
    
    tempContainer.appendChild(title);
    tempContainer.appendChild(scheduleCopy);
    
    document.body.appendChild(tempContainer);
    
    // Ждем немного для отрисовки
    setTimeout(() => {
        html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true
        }).then(canvas => {
            // Создаем PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 190; // Ширина изображения в мм
            const pageHeight = 280; // Высота страницы A4 в мм
            const imgHeight = canvas.height * imgWidth / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 10;
            
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            // Если изображение не помещается на одну страницу
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            // Сохраняем PDF
            pdf.save(`raspisanie_${className.replace('/', '_')}.pdf`);
            
            // Удаляем временный контейнер
            document.body.removeChild(tempContainer);
        }).catch(error => {
            console.error('Ошибка при создании PDF:', error);
            alert('Ошибка при создании PDF файла');
            
            // Удаляем временный контейнер
            document.body.removeChild(tempContainer);
        });
    }, 100);
}