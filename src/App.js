import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

// Conectar al backend mediante Socket.IO
const socket = io("https://pomodoroback-production.up.railway.app/");

function App() {
  const [time, setTime] = useState(1500); // Tiempo restante en segundos
  const [isRunning, setIsRunning] = useState(false); // Estado del temporizador
  const [workTime, setWorkTime] = useState(25 * 60); // Tiempo de trabajo en segundos
  const [breakTime, setBreakTime] = useState(5 * 60); // Tiempo de descanso en segundos
  const [isBreak, setIsBreak] = useState(false); // Indica si es descanso o trabajo
  const [cycles, setCycles] = useState(4); // Cantidad de ciclos
  const [currentCycle, setCurrentCycle] = useState(1); // Ciclo actual

  // Emitir el estado del temporizador al servidor
  useEffect(() => {
    if (isRunning) {
      socket.emit("sync-timer", {
        time,
        isRunning,
        isBreak,
        currentCycle,
        workTime,
        breakTime,
      });
    }
  }, [time, isRunning, isBreak, currentCycle, workTime, breakTime]);

  // Escuchar eventos del servidor para sincronizar con otros clientes
  useEffect(() => {
    socket.on("update-timer", (data) => {
      setTime(data.time);
      setIsRunning(data.isRunning);
      setIsBreak(data.isBreak);
      setCurrentCycle(data.currentCycle);
      setWorkTime(data.workTime);
      setBreakTime(data.breakTime);
    });

    // Limpiar los eventos al desmontar el componente
    return () => socket.off("update-timer");
  }, []);

  // Lógica para iniciar/detener el temporizador
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Actualizar el temporizador cada segundo
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime > 0) {
            return prevTime - 1;
          } else {
            handleCycleCompletion();
            return 0;
          }
        });
      }, 1000);

      return () => clearInterval(interval); // Limpiar el intervalo al detener
    }
  }, [isRunning]);

  // Manejar la finalización de un ciclo (trabajo o descanso)
  const handleCycleCompletion = () => {
    if (isBreak) {
      setCurrentCycle((prevCycle) => prevCycle + 1);
      setIsBreak(false);
      setTime(workTime);
    } else {
      if (currentCycle < cycles) {
        setIsBreak(true);
        setTime(breakTime);
      } else {
        setIsRunning(false);
        alert("Pomodoro completado 🎉");
      }
    }
  };

  // Manejar cambios en el tiempo de trabajo o descanso
  const handleTimeChange = (setter) => (e) => {
    const value = Math.max(1, Number(e.target.value)) * 60; // Mínimo 1 minuto
    setter(value);
  };

  // Manejar cambios en la cantidad de ciclos
  const handleCycleChange = (e) => {
    setCycles(Math.max(1, Number(e.target.value))); // Mínimo 1 ciclo
  };

  // Reiniciar el temporizador
  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setCurrentCycle(1);
    setTime(workTime);
  };

  return (
    <><title>"Pomodoro"</title>
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Pomodoro Timer</h1>
      <h2>{isBreak ? "Descanso" : "Trabajo"} - Ciclo {currentCycle} de {cycles}</h2>
      <h2>
        {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}
      </h2>
      <button onClick={toggleTimer}>
        {isRunning ? "Pausar" : "Iniciar"}
      </button>
      <button onClick={resetTimer} style={{ marginLeft: "10px" }}>
        Reiniciar
      </button>
      <div style={{ marginTop: "20px" }}>
        <label htmlFor="workTime">Tiempo de trabajo (min):</label>
        <input
          type="number"
          id="workTime"
          value={workTime / 60}
          onChange={handleTimeChange(setWorkTime)}
          disabled={isRunning}
          min="1" />
        <br />
        <label htmlFor="breakTime">Tiempo de descanso (min):</label>
        <input
          type="number"
          id="breakTime"
          value={breakTime / 60}
          onChange={handleTimeChange(setBreakTime)}
          disabled={isRunning}
          min="1" />
        <br />
        <label htmlFor="cycles">Ciclos:</label>
        <input
          type="number"
          id="cycles"
          value={cycles}
          onChange={handleCycleChange}
          disabled={isRunning}
          min="1" />
      </div>
    </div></>
  );
}

export default App;