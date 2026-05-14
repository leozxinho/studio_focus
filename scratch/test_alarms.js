
// Simulação da lógica de tags do OneSignal
function testAlarmTags(times) {
    var tags = {};
    times.forEach(function(t) {
        var tagKey = 'alarm_' + t.replace(':', '');
        tags[tagKey] = "1";
    });
    return tags;
}

const exampleTimes = ["08:00", "14:30", "20:00"];
const resultTags = testAlarmTags(exampleTimes);

console.log("Horários configurados:", exampleTimes);
console.log("Tags que serão enviadas ao OneSignal:", JSON.stringify(resultTags, null, 2));

// Verifica se o formato bate com o que o Cron Worker espera (alarm_HHMM)
const cronExpected = "alarm_0800";
if (resultTags[cronExpected] === "1") {
    console.log("\n✅ SUCESSO: A tag '" + cronExpected + "' foi gerada corretamente!");
} else {
    console.log("\n❌ ERRO: Formato de tag incorreto.");
}
