<script>
    import { onMount } from "svelte";

    import sweep from "../sweep";
    import Tree from "../Tree.svelte";

    let NLinesToGenerate = 10;
    let canvas;
    let context;

    let firstClick = null;
    let secondClick = null;
    let points = [];
    let lines = [];
    let intersections = [];
    let sweepIntersections = [];
    let bruteElapsedTime = null;
    let sweepElapsedTime = null;
    let xManualInput = null;
    let yManualInput = null;

    function onClearButtonClick() {
        lines = [];
        intersections = [];
        sweepIntersections = [];
        points = [];
        sweepElapsedTime = null;
        bruteElapsedTime = null;
        firstClick = null;
        secondClick = null;
        context.clearRect(0, 0, canvas.width, canvas.height);

        sweepHandler = null;
        isSweepStepProcessing = null;
        eventQueue = null;
        sweepStatus = null;
        sweepResults = null;
        currentSweepLineY = null;
    }

    onMount(() => {
        context = canvas.getContext("2d");
        context.lineWidth = 2;
    });

    const onGenerateRandomLinesButtonClick = () => {
        const lines_ = [];
        for (let i = 0; i < NLinesToGenerate; i++) {
            const start = {
                x: Math.floor(Math.random() * canvas.width),
                y: Math.floor(Math.random() * canvas.height),
            };
            const end = {
                x: Math.floor(Math.random() * canvas.width),
                y: Math.floor(Math.random() * canvas.height),
            };
            points = [...points, start, end];
            drawPoint(start, points.length - 2);
            drawPoint(end, points.length - 1);
            lines_.push({ start, end });
        }
        lines = [...lines, ...lines_];
        lines.forEach((line) => {
            drawLine(line.start, line.end);
        });
    };

    const onFindIntersectionsButtonClick = () => {
        const lines_for_sweep = lines.map((line) => {
            return { from: line.start, to: line.end };
        });

        const detectIntersections = sweep(lines_for_sweep);

        const startTime = performance.now();

        const sweepIntersections_ = detectIntersections.run();
        const endTime = performance.now();
        const elapsedTime = endTime - startTime;
        sweepElapsedTime = elapsedTime;
        sweepIntersections = sweepIntersections_;

        const startTime2 = performance.now();
        intersections = findAllIntersections(lines);

        const endTime2 = performance.now();
        const elapsedTime2 = endTime2 - startTime2;
        bruteElapsedTime = elapsedTime2;
        drawIntersections();
    };

    function findIntersection(line1, line2) {
        var det, gamma, lambda;
        var a = line1.start;
        var b = line1.end;
        var c = line2.start;
        var d = line2.end;

        det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y);
        if (det === 0) {
            return null; // no intersection
        } else {
            lambda =
                ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
            gamma =
                ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
            if (0 < lambda && lambda < 1 && 0 < gamma && gamma < 1) {
                return {
                    x: a.x + lambda * (b.x - a.x),
                    y: a.y + lambda * (b.y - a.y),
                };
            } else {
                return null; // no intersection
            }
        }
    }

    function findAllIntersections(lines) {
        const intersections = [];

        for (let i = 0; i < lines.length - 1; i++) {
            for (let j = i + 1; j < lines.length; j++) {
                const intersection = findIntersection(lines[i], lines[j]);
                if (intersection !== null) {
                    intersections.push(intersection);
                }
            }
        }

        return intersections;
    }

    function handleCanvasClick(event) {
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        if (!firstClick) {
            firstClick = { x: x, y: y };
            points = [...points, firstClick];
            drawPoint(firstClick, points.length - 1);
        } else {
            secondClick = { x: x, y: y };
            points = [...points, secondClick];
            const newLine = { start: firstClick, end: secondClick };
            lines = [...lines, newLine];

            drawPoint(secondClick, points.length - 1);
            drawLine(firstClick, secondClick);

            firstClick = null;
            secondClick = null;
        }
    }

    function drawLine(start, end, color = null) {
        console.log("color", color);
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        if (color === null) {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            const color = `rgb(${r},${g},${b})`;
            context.strokeStyle = color;
        } else {
            context.strokeStyle = color;
        }
        context.stroke();
    }

    function drawPoint(point, index = null) {
        context.beginPath();
        context.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        context.fillStyle = "black";
        context.fill();
        if (index !== null) {
            context.font = "12px Arial";
            context.fillStyle = "black";
            context.fillText(index, point.x + 8, point.y - 8);
        }
    }

    function drawIntersections() {
        intersections.forEach(function (point) {
            context.beginPath();
            context.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            context.fillStyle = "red";
            context.fill();
        });
    }

    function redrawCanvasWithSweep() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        points.forEach((point, index) => {
            drawPoint(point, index);
        });
        lines.forEach((line) => {
            drawLine(line.start, line.end);
        });
        if (currentSweepLineY) {
            drawLine(
                { x: 0, y: currentSweepLineY },
                { x: canvas.width, y: currentSweepLineY },
                "rgb(255,0,0)",
            );
            context.beginPath();
            context.font = "12px Arial";
            context.fillStyle = "red";
            context.fillText(
                `Y: ${currentSweepLineY}`,
                20,
                currentSweepLineY - 8,
            );
        }
    }

    function onAddPointByManualInputButtonClick() {
        if (xManualInput === null || yManualInput === null) {
            return;
        }
        const newPoint = { x: Number(xManualInput), y: Number(yManualInput) };
        points = [...points, newPoint];
        drawPoint(newPoint, points.length - 1);
        if (firstClick === null) {
            firstClick = newPoint;
            return;
        }

        const newLine = { start: firstClick, end: newPoint };
        lines = [...lines, newLine];
        drawLine(newLine.start, newLine.end);
        firstClick = null;
        secondClick = null;
    }

    let sweepHandler = null;
    let isSweepStepProcessing = null;
    let eventQueue = null;
    let sweepStatus = null;
    let sweepResults = null;
    let currentSweepLineY = null;
    const stepByStepExecution = () => {
        if (lines.length === 0 || points.length === 0) {
            return;
        }
        if (sweepHandler && isSweepStepProcessing === false) {
            return;
        }
        if (sweepHandler === null) {
            const lines_for_sweep = lines.map((line) => {
                return { from: line.start, to: line.end };
            });

            sweepHandler = sweep(lines_for_sweep);
            eventQueue = sweepHandler.eventQueue;
            sweepStatus = sweepHandler.sweepStatus;
            sweepResults = sweepHandler.results;
            currentSweepLineY = sweepHandler.sweepState.currentSweepLineY;
            currentSweepLineY = canvas.height - 1;
            drawLine(
                { x: 0, y: currentSweepLineY },
                { x: canvas.width, y: currentSweepLineY },
                "rgb(255,0,0)",
            );
            context.beginPath();
            context.font = "12px Arial";
            context.fillStyle = "red";
            context.fillText(
                `Y: ${currentSweepLineY}`,
                20,
                currentSweepLineY - 8,
            );
            return;
        }

        isSweepStepProcessing = sweepHandler.step();
        eventQueue = sweepHandler.eventQueue;
        sweepStatus = sweepHandler.sweepStatus;
        sweepResults = sweepHandler.results;
        currentSweepLineY = sweepHandler.sweepState.currentSweepLineY;
        if (!isSweepStepProcessing) {
            currentSweepLineY = null;
        }
        redrawCanvasWithSweep();
    };
</script>

<svelte:head>
    <title>Заметающая прямая</title>
</svelte:head>

<div class="main">
    <h3>Реализация метода заметающей прямой для поиска пересечений</h3>
    <div>
        <span>Генерировать линий:</span>
        <input type="number" bind:value={NLinesToGenerate} />
        <button on:click={onGenerateRandomLinesButtonClick}>
            Сгенерировать линии
        </button>
    </div>
    <div>Добавить точку по координатам</div>
    <div>
        <span>X: </span><input
            bind:value={xManualInput}
            placeholder="Введите координату X точки"
        />
    </div>
    <div>
        <span>Y: </span><input
            bind:value={yManualInput}
            placeholder="Введите координату Y точки"
        />
    </div>
    <button on:click={onAddPointByManualInputButtonClick}>Добавить точку</button
    >
    <div>
        {#if !firstClick}
            Добавьте первую точку отрезка нажатием на холст
        {:else}
            Добавьте вторую точку отрезка нажатием на холст
        {/if}
    </div>

    <div style="display: flex">
        <div>
            <canvas
                style="align-self: flex-start;"
                width="400"
                height="400"
                bind:this={canvas}
                on:click={handleCanvasClick}
            >
            </canvas>
            <div>
                <button on:click={onClearButtonClick}>Очистить</button>
                <button on:click={onFindIntersectionsButtonClick}>
                    Найти пересечения
                </button>
                <button on:click={stepByStepExecution}
                    >Пошаговое выполнение</button
                >
            </div>

            <div>
                <h3>Точек - {points.length}</h3>
                <h3>Отрезков - {lines.length}</h3>
                <h3>
                    Пересечений - {sweepIntersections.length}
                </h3>
                {#if bruteElapsedTime !== null}
                    <h4>
                        Время полного перебора - {bruteElapsedTime.toFixed(3)} мс
                    </h4>
                {/if}
                {#if sweepElapsedTime !== null}
                    <h4>
                        Время метода заметающей прямой - {sweepElapsedTime.toFixed(
                            3,
                        )} мс
                    </h4>
                {/if}
            </div>
        </div>
        <div>
            {#if eventQueue?.q}
                <Tree
                    root={eventQueue.q._root}
                    size={eventQueue.q._size}
                    name="Очередь событий"
                />
            {/if}
        </div>
        <div>
            {#if sweepStatus?.status}
                <Tree
                    root={sweepStatus.status._root}
                    size={sweepStatus.status._size}
                    name="Статус"
                />
            {/if}
        </div>
        <div>
            {#if sweepResults}
                <h3>Найденные точки пересечения</h3>
                <ol>
                    {#each sweepResults as result}
                        <li>{JSON.stringify(result.point)}</li>
                    {/each}
                </ol>
            {/if}
        </div>
    </div>
    <div>
        <h3>Точки</h3>
        <div>
            <ol start="0">
                {#each points as point}
                    <li>
                        {JSON.stringify(point)}
                    </li>
                {/each}
            </ol>
        </div>
    </div>
</div>

<style>
    .main {
        margin: 8px;
    }
    canvas {
        border: 1px solid black;
    }
</style>
